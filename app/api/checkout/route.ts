import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { createDokuCheckoutUrl } from "@/lib/doku";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

// Header khusus untuk mengizinkan request dari Blogspot (CORS)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, customerEmail, customerName } = body;

    if (!productId || !customerEmail || !customerName) {
      return NextResponse.json(
        { success: false, message: "Parameter tidak lengkap" },
        { status: 400, headers: corsHeaders }
      );
    }

    const productDoc = await db.collection("products").doc(productId).get();
    if (!productDoc.exists) {
      return NextResponse.json(
        { success: false, message: "Produk tidak ditemukan di database" },
        { status: 404, headers: corsHeaders }
      );
    }
    const productData = productDoc.data();

    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const orderRef = db.collection("orders").doc(invoiceNumber);
    await orderRef.set({
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://store-indol-seven.vercel.app";
    const dokuResponse = await createDokuCheckoutUrl({
      invoiceNumber,
      amount: productData?.price || 0,
      customerEmail,
      customerName,
      productName: productData?.name || "Digital Product",
      callbackUrl: `${appUrl}/api/access?invoice=${invoiceNumber}`,
    });

    return NextResponse.json(
      {
        success: true,
        invoiceNumber,
        paymentUrl: dokuResponse.response.payment.url,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Checkout Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Terjadi kesalahan server" },
      { status: 500, headers: corsHeaders }
    );
  }
}
