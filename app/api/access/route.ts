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

    // 2. Cari / Buat Lisensi Terkait
    const licenseSnapshot = await db
      .collection("licenses")
      .where("invoiceNumber", "==", invoiceNumber)
      .limit(1)
      .get();

    let licenseKey = "";

    if (!licenseSnapshot.empty) {
      licenseKey = licenseSnapshot.docs[0].data().licenseKey;
    } else {
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

    // 3. Ambil Detail Produk untuk Menentukan Tipe Tampilan
    const productDoc = await db.collection("products").doc(orderData.productId).get();
    const productData = productDoc.data();
    
    // Tipe Produk: "DOWNLOAD" (default) atau "ACCESS"
    const productType = productData?.type || "DOWNLOAD"; 
    const telegramFileId = productData?.telegramFileId || "";
    const targetAppUrl = productData?.appUrl || "#";

    // 4. Render Tombol Aksi Berdasarkan Tipe Produk
    let actionButtonHtml = "";

    if (productType === "ACCESS") {
      actionButtonHtml = `
        <a href="${targetAppUrl}" target="_blank" class="btn-action btn-access">Buka Aplikasi / Login</a>
        <p class="instruction">Gunakan Kode Lisensi dan Email Anda untuk login ke dalam aplikasi.</p>
      `;
    } else {
      actionButtonHtml = `
        <a href="/api/download/${telegramFileId || "default"}" class="btn-action btn-download">Unduh File Software</a>
        <p class="instruction">Gunakan Kode Lisensi di atas saat menjalankan installer/aplikasi.</p>
      `;
    }

    // 5. Render Halaman HTML Rapi
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Akses Produk & Lisensi - STORE Engine</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
            background: #0f172a; 
            color: #f8fafc; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            margin: 0; 
            padding: 20px; 
            box-sizing: border-box; 
          }
          .card { 
            background: #1e293b; 
            border: 1px solid #334155; 
            border-radius: 16px; 
            padding: 32px; 
            max-width: 480px; 
            width: 100%; 
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); 
            text-align: center; 
          }
          .badge { 
            background: #10b981; 
            color: #fff; 
            padding: 6px 16px; 
            border-radius: 99px; 
            font-weight: bold; 
            font-size: 0.85rem; 
            display: inline-block; 
            margin-bottom: 16px; 
          }
          h1 { font-size: 1.5rem; margin: 0 0 8px 0; color: #fff; }
          p.sub { color: #94a3b8; font-size: 0.95rem; margin: 0 0 24px 0; }
          .license-title { text-align: left; margin-bottom: 8px; font-size: 0.85rem; color: #94a3b8; font-weight: 600; }
          .license-box { 
            background: #0f172a; 
            border: 1px dashed #475569; 
            border-radius: 8px; 
            padding: 16px; 
            font-family: monospace; 
            font-size: 1.2rem; 
            color: #38bdf8; 
            letter-spacing: 1px; 
            margin-bottom: 20px; 
            word-break: break-all; 
            user-select: all;
          }
          .btn-action { 
            display: block; 
            width: 100%; 
            padding: 14px; 
            color: #fff; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: bold; 
            font-size: 1rem; 
            box-sizing: border-box; 
            transition: background 0.2s; 
          }
          .btn-download { background: #2563eb; }
          .btn-download:hover { background: #1d4ed8; }
          .btn-access { background: #059669; }
          .btn-access:hover { background: #047857; }
          .instruction { font-size: 0.8rem; color: #64748b; margin-top: 12px; margin-bottom: 0; }
          .footer { margin-top: 24px; font-size: 0.8rem; color: #64748b; border-top: 1px solid #334155; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="badge">PEMBAYARAN BERHASIL</span>
          <h1>${orderData.productName || "Digital Product"}</h1>
          <p class="sub">Terima kasih! Pembelian Anda telah dikonfirmasi.</p>
          
          <div class="license-title">KODE LISENSI ANDA:</div>
          <div class="license-box">${licenseKey}</div>
          
          ${actionButtonHtml}
          
          <div class="footer">Invoice: ${invoiceNumber} | Email: ${orderData.customerEmail}</div>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(htmlContent, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error: any) {
    console.error("Access API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error: " + error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
