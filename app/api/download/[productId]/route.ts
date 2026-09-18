import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/security/auth-guard";
import { fetchTelegramFileStream } from "@/lib/telegram/client";

export async function GET(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    // 1. Verifikasi Autentikasi User via ID Token
    const user = await verifyAuthToken(req);
    const { productId } = params;

    if (!productId) {
      return NextResponse.json({ error: "Product ID diperlukan." }, { status: 400 });
    }

    // 2. Otorisasi Pembelian: Cek apakah user telah membeli produk ini dengan status PAID
    const ordersSnap = await adminDb
      .collection("orders")
      .where("userId", "==", user.uid)
      .where("productId", "==", productId)
      .where("status", "==", "PAID")
      .limit(1)
      .get();

    if (ordersSnap.empty) {
      return NextResponse.json(
        { error: "FORBIDDEN: Anda belum membeli produk ini atau pembayaran belum terverifikasi." },
        { status: 403 }
      );
    }

    const orderDoc = ordersSnap.docs[0];

    // 3. Ambil data produk & Telegram File ID dari Firestore
    const productDoc = await adminDb.collection("products").doc(productId).get();
    if (!productDoc.exists) {
      return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    }

    const productData = productDoc.data();
    if (productData?.type !== "download" || !productData?.telegramFileId) {
      return NextResponse.json(
        { error: "Produk ini tidak menyediakan file download." },
        { status: 400 }
      );
    }

    // 4. Catat Log Aktivitas Download ke Firestore
    const clientIp = req.headers.get("x-forwarded-for") || "0.0.0.0";
    const userAgent = req.headers.get("user-agent") || "unknown";

    await adminDb.collection("downloads").add({
      userId: user.uid,
      productId,
      orderId: orderDoc.id,
      downloadedAt: new Date().toISOString(),
      ipHash: clientIp,
      userAgent,
    });

    // 5. Stream File dari Telegram ke Client (Proxy)
    const telegramResponse = await fetchTelegramFileStream(productData.telegramFileId);
    
    const headers = new Headers();
    headers.set(
      "Content-Type",
      telegramResponse.headers.get("content-type") || "application/octet-stream"
    );
    headers.set(
      "Content-Disposition",
      `attachment; filename="${productData.name.replace(/[^a-zA-Z0-9]/g, "_")}.zip"`
    );

    return new NextResponse(telegramResponse.body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Akses download ditolak.", details: error.message },
      { status: 401 }
    );
  }
}
