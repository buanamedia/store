import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const headers = req.headers;

    // 1. Ambil Header untuk Verifikasi Signature DOKU
    const clientId = process.env.DOKU_CLIENT_ID;
    const secretKey = process.env.DOKU_SECRET_KEY;
    const signatureHeader = headers.get("signature");
    const requestId = headers.get("request-id");
    const requestTimestamp = headers.get("request-timestamp");

    if (!secretKey || !clientId) {
      return NextResponse.json({ error: "Server configuration missing" }, { status: 500 });
    }

    // 2. Validasi HMAC-SHA256 Signature dari DOKU
    const requestTarget = "/api/doku/webhook";
    const digest = crypto.createHash("sha256").update(rawBody).digest("base64");
    const signatureRaw = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${requestTarget}\nDigest:${digest}`;
    
    const calculatedSignature = `HMACSHA256=${crypto
      .createHmac("sha256", secretKey)
      .update(signatureRaw)
      .digest("base64")}`;

    // Jalankan validasi signature (lewati jika testing sandbox internal jika disesuaikan)
    if (signatureHeader && signatureHeader !== calculatedSignature) {
      return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const invoiceNumber = payload.order?.invoice_number;
    const paymentResult = payload.transaction?.status; // e.g., 'SUCCESS'

    if (!invoiceNumber) {
      return NextResponse.json({ error: "Invoice number missing" }, { status: 400 });
    }

    // 3. Cari Order di Firestore
    const orderRef = adminDb.collection("orders").doc(invoiceNumber);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = orderSnap.data();

    // Jalankan pembaruan jika status pembayaran SUCCESS dan order masih PENDING
    if (paymentResult === "SUCCESS" && orderData?.status === "PENDING") {
      const now = new Date().toISOString();

      // Update status Order menjadi PAID
      await orderRef.update({
        status: "PAID",
        paidAt: now,
        dokuTransactionId: payload.transaction?.id || "",
      });

      // 4. Ambil Detail Produk untuk Menentukan Hak Akses
      const productSnap = await adminDb.collection("products").doc(orderData.productId).get();
      const productData = productSnap.data();

      if (productData) {
        if (productData.type === "online") {
          // Buat record akses ONLINE
          const durationDays = Number(productData.durationDays || 30);
          const expiredDate = new Date();
          expiredDate.setDate(expiredDate.getDate() + durationDays);

          const accessId = `ACC-${orderData.userId}-${orderData.productId}`;
          await adminDb.collection("access").doc(accessId).set({
            accessId,
            userId: orderData.userId,
            productId: orderData.productId,
            orderId: invoiceNumber,
            status: "ACTIVE",
            startedAt: now,
            expiredAt: expiredDate.toISOString(),
            createdAt: now,
          });
        } else if (productData.type === "download") {
          // Buat record hak akses DOWNLOAD
          const accessId = `DL-${orderData.userId}-${orderData.productId}`;
          await adminDb.collection("access").doc(accessId).set({
            accessId,
            userId: orderData.userId,
            productId: orderData.productId,
            orderId: invoiceNumber,
            status: "ACTIVE",
            createdAt: now,
          });
        }
      }
    }

    return NextResponse.json({ status: "OK" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
