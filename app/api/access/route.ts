import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const invoice = searchParams.get("invoice");
    const license = searchParams.get("license");

    if (!invoice && !license) {
      return NextResponse.json(
        { success: false, message: "Invoice atau License Key diperlukan" },
        { status: 400 }
      );
    }

    let licenseData: any = null;

    if (license) {
      const licDoc = await db.collection("licenses").doc(license).get();
      if (licDoc.exists && licDoc.data()?.status === "ACTIVE") {
        licenseData = licDoc.data();
      }
    } else if (invoice) {
      const licQuery = await db
        .collection("licenses")
        .where("invoiceNumber", "==", invoice)
        .limit(1)
        .get();

      if (!licQuery.empty) {
        licenseData = licQuery.docs[0].data();
      }
    }

    if (!licenseData) {
      return NextResponse.json(
        { success: false, message: "Akses tidak ditemukan atau belum lunas" },
        { status: 404 }
      );
    }

    // Ambil data Telegram Storage ID dari Dokumen Produk
    const productDoc = await db.collection("products").doc(licenseData.productId).get();
    const productData = productDoc.data();

    return NextResponse.json({
      success: true,
      licenseKey: licenseData.licenseKey,
      status: licenseData.status,
      productName: productData?.name || "Digital Product",
      downloadUrl: `/api/download/${productData?.telegramFileId}`,
    });
  } catch (error: any) {
    console.error("Access API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
