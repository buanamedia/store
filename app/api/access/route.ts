import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceNumber = searchParams.get("invoice");

    if (!invoiceNumber) {
      return NextResponse.json(
        { success: false, message: "Parameter invoice tidak ditemukan" },
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Cek Data Pesanan
    const orderDoc = await db.collection("orders").doc(invoiceNumber).get();
    if (!orderDoc.exists) {
      return NextResponse.json(
        { success: false, message: "Akses tidak ditemukan atau invoice salah" },
        { status: 404, headers: corsHeaders }
      );
    }

    const orderData = orderDoc.data();

    // Pastikan pesanan sudah PAID
    if (orderData?.status !== "PAID") {
      return NextResponse.json(
        { success: false, message: "Akses tidak ditemukan atau pembayaran belum lunas" },
        { status: 403, headers: corsHeaders }
      );
    }

    // 2. Cari Lisensi Terkait
    const licenseSnapshot = await db
      .collection("licenses")
      .where("invoiceNumber", "==", invoiceNumber)
      .limit(1)
      .get();

    let licenseKey = "";

    if (!licenseSnapshot.empty) {
      licenseKey = licenseSnapshot.docs[0].data().licenseKey;
    } else {
      // Jika Lisensi belum ada, buat otomatis
      licenseKey = `LIC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await db.collection("licenses").add({
        licenseKey,
        invoiceNumber,
        customerEmail: orderData.customerEmail,
        productId: orderData.productId,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      });
    }

    // 3. Ambil data produk untuk file Telegram ID
    const productDoc = await db.collection("products").doc(orderData.productId).get();
    const productData = productDoc.data();
    const telegramFileId = productData?.telegramFileId || "";

    return NextResponse.json(
      {
        success: true,
        invoiceNumber,
        productName: orderData.productName,
        customerEmail: orderData.customerEmail,
        licenseKey,
        status: "ACTIVE",
        downloadUrl: `/api/download/${telegramFileId || "default"}`,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Access API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error: " + error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
