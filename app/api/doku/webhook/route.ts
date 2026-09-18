import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const headers = req.headers;

    const clientId = process.env.DOKU_CLIENT_ID;
    const secretKey = process.env.DOKU_SECRET_KEY;
    const signatureHeader = headers.get("signature");
    const requestId = headers.get("request-id");
    const requestTimestamp = headers.get("request-timestamp");

    if (!secretKey || !clientId) {
      return NextResponse.json({ error: "Server configuration missing" }, { status: 500 });
    }

    const requestTarget = "/api/doku/webhook";
    const digest = crypto.createHash("sha256").update(rawBody).digest("base64");
    const signatureRaw = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${requestTarget}\nDigest:${digest}`;
    
    const calculatedSignature = `HMACSHA256=${crypto
      .createHmac("sha256", secretKey)
      .update(signatureRaw)
      .digest("base64")}`;

    if (signatureHeader && signatureHeader !== calculatedSignature) {
      return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const invoiceNumber = payload.order?.invoice_number;
    const paymentResult = payload.transaction?.status;

    if (!invoiceNumber) {
      return NextResponse.json({ error: "Invoice number missing" }, { status: 400 });
    }

    const adminDb = getAdminDb();
    const orderRef = adminDb.collection("orders").doc(invoiceNumber);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = orderSnap.data();

    if (paymentResult === "SUCCESS" && orderData?.status === "PENDING") {
      const now = new Date().toISOString();

      await orderRef.update({
        status: "PAID",
        paidAt: now,
        dokuTransactionId: payload.transaction?.id || "",
      });

      const productSnap = await adminDb.collection("products").doc(orderData.productId).get();
      const productData = productSnap.data();

      if (productData) {
        if (productData.type === "online") {
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
