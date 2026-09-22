import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { createDokuCheckoutUrl } from "@/lib/doku";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET() {
  return NextResponse.json({ status: "STORE Engine API Online" }, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { productId, customerEmail, customerName } = body;

    if (!productId || !customerEmail || !customerName) {
      return NextResponse.json(
        { success: false, message: "Parameter nama, email, atau productId tidak lengkap" },
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Ambil data produk dari Firestore
    const productDoc = await db.collection("products").doc(productId).get();
    if (!productDoc.exists) {
      return NextResponse.json(
        { success: false, message: `Produk '${productId}' belum dibuat di Firestore` },
        { status: 404, headers: corsHeaders }
      );
    }
    const productData = productDoc.data();

    // 2. Cek Stok Lisensi Manual
    if (productData?.hasLicense !== false && productData?.licenseMode === "MANUAL") {
      let keys: string[] = [];
      if (Array.isArray(productData.manualKeys)) {
        keys = productData.manualKeys;
      } else if (typeof productData.manualKeys === "string") {
        keys = productData.manualKeys.split("\n").map((k) => k.trim()).filter(Boolean);
      }

      if (keys.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            message: "Mohon maaf, stok lisensi untuk produk ini sedang habis. Silakan hubungi admin." 
          },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 3. Simpan order ke Firestore
    await db.collection("orders").doc(invoiceNumber).set({
      invoiceNumber,
      productId,
      productName: productData?.name || "Digital Product",
      amount: productData?.price || 0,
      customerEmail,
      customerName,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 4. Buat URL Pembayaran DOKU
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://store-indol-seven.vercel.app";
    const dokuResponse = await createDokuCheckoutUrl({
      invoiceNumber,
      amount: Number(productData?.price || 0),
      customerEmail,
      customerName,
      productName: productData?.name || "Digital Product",
      callbackUrl: `${appUrl}/api/access?invoice=${invoiceNumber}`,
    });

    const paymentUrl = dokuResponse?.response?.payment?.url || dokuResponse?.payment?.url;

    return NextResponse.json(
      {
        success: true,
        invoiceNumber,
        paymentUrl,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Checkout Route Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error: " + (error.message || "Terjadi kesalahan pada backend") },
      { status: 500, headers: corsHeaders }
    );
  }
}
