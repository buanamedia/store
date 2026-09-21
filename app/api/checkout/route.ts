import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { createDokuCheckoutUrl } from "@/lib/doku";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { productId, customerEmail, customerName } = body;

    if (!productId || !customerEmail || !customerName) {
      return NextResponse.json(
        { success: false, message: "Data nama, email, atau produk tidak lengkap" },
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Ambil data produk dari Firestore
    let productData: any = null;
    try {
      const productDoc = await db.collection("products").doc(productId).get();
      if (!productDoc.exists) {
        return NextResponse.json(
          { success: false, message: `Produk '${productId}' tidak ditemukan di Firestore` },
          { status: 404, headers: corsHeaders }
        );
      }
      productData = productDoc.data();
    } catch (dbErr: any) {
      console.error("Firestore Error:", dbErr);
      return NextResponse.json(
        { success: false, message: "Gagal terhubung ke database Firebase: " + dbErr.message },
        { status: 500, headers: corsHeaders }
      );
    }

    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 2. Simpan order PENDING ke Firestore
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

    // 3. Panggil API DOKU Checkout
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

    if (!paymentUrl) {
      return NextResponse.json(
        { success: false, message: "DOKU tidak mengembalikan URL pembayaran" },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        invoiceNumber,
        paymentUrl,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Checkout Fatal Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Terjadi kesalahan internal pada server" },
      { status: 500, headers: corsHeaders }
    );
  }
}
