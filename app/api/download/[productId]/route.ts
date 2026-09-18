import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/security/auth-guard";
import { fetchTelegramFileStream } from "@/lib/telegram/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const user = await verifyAuthToken(req);
    const { productId } = params;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID diperlukan." },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();

    const ordersSnap = await adminDb
      .collection("orders")
      .where("userId", "==", user.uid)
      .where("productId", "==", productId)
      .where("status", "==", "PAID")
      .limit(1)
      .get();

    if (ordersSnap.empty) {
      return NextResponse.json(
        {
          error:
            "FORBIDDEN: Anda belum membeli produk ini atau pembayaran belum terverifikasi.",
        },
        { status: 403 }
      );
    }

    const orderDoc = ordersSnap.docs[0];
    const productDoc = await adminDb.collection("products").doc(productId).get();

    if (!productDoc.exists) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan." },
        { status: 404 }
      );
    }

    const productData = productDoc.data();
    if (productData?.type !== "download" || !productData?.telegramFileId) {
      return NextResponse.json(
        { error: "Produk ini tidak menyediakan file download." },
        { status: 400 }
      );
    }

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

    const telegramResponse = await fetchTelegramFileStream(
      productData.telegramFileId
    );

    const headers = new Headers();
    headers.set(
      "Content-Type",
      telegramResponse.headers.get("content-type") ||
        "application/octet-stream"
    );
    headers.set(
      "Content-Disposition",
      `attachment; filename="${productData.name.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}.zip"`
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
