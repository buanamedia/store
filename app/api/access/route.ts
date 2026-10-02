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

    // 2. Ambil Nomor WA Admin dari Settings Firestore
    let adminWhatsapp = "081414159500";
    try {
      const settingsSnap = await db.collection("settings").doc("store_layout").get();
      if (settingsSnap.exists && settingsSnap.data()?.adminWhatsapp) {
        adminWhatsapp = settingsSnap.data()?.adminWhatsapp;
      }
    } catch (err) {
      console.warn("Gagal mengambil settings admin WA:", err);
    }

    // Cek apakah produk ini adalah GESTUN
    const isGestun =
      orderData.productId === "GESTUN" ||
      (orderData.productName && orderData.productName.toLowerCase().includes("gestun"));

    // 3. Ambil Detail Produk
    const productDoc = await db.collection("products").doc(orderData.productId).get();
    const productData = productDoc.data();

    const productType = productData?.type || "DOWNLOAD";
    const hasLicense = !isGestun && productData?.hasLicense !== false;
    const telegramFileId = productData?.telegramFileId || "";
    const targetAppUrl = productData?.appUrl || "#";

    // 4. Kelola / Buat Lisensi Jika Memang Diperlukan (Bukan Gestun)
    let licenseKey = "";
    if (hasLicense) {
      const licenseSnapshot = await db
        .collection("licenses")
        .where("invoiceNumber", "==", invoiceNumber)
        .limit(1)
        .get();

      if (!licenseSnapshot.empty) {
        licenseKey = licenseSnapshot.docs[0].data().licenseKey;
      } else {
        const licenseMode = productData?.licenseMode || "AUTO";

        if (licenseMode === "MANUAL" && Array.isArray(productData?.manualKeys) && productData.manualKeys.length > 0) {
          const manualKeys: string[] = [...productData.manualKeys];
          licenseKey = manualKeys.shift() || `LIC-${Date.now()}`;

          await db.collection("products").doc(orderData.productId).update({
            manualKeys: manualKeys,
          });
        } else if (licenseMode === "GENERATOR" && productData?.generatorApiUrl) {
          try {
            const genRes = await fetch(productData.generatorApiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                customerEmail: orderData.customerEmail,
                customerName: orderData.customerName,
                invoiceNumber: invoiceNumber,
              }),
            });
            const genData = await genRes.json();
            licenseKey = genData?.licenseKey || genData?.key || `LIC-${Date.now()}`;
          } catch (e) {
            console.error("Generator Key API Error:", e);
            licenseKey = `LIC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          }
        } else {
          licenseKey = `LIC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        }

        await db.collection("licenses").add({
          licenseKey,
          invoiceNumber,
          customerEmail: orderData.customerEmail,
          productId: orderData.productId,
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
        });
      }
    }

    // 5. Render Blok Tampilan Lisensi
    const licenseHtml = hasLicense
      ? `
        <div class="license-title">KODE LISENSI ANDA:</div>
        <div class="license-box">${licenseKey}</div>
      `
      : "";

    // 6. Render Tombol Aksi Berdasarkan Tipe Produk & Status Gestun
    let actionButtonHtml = "";

    if (isGestun) {
      // Format WA Admin
      const cleanWa = adminWhatsapp.replace(/\D/g, "");
      const formattedWa = cleanWa.startsWith("0") ? "62" + cleanWa.slice(1) : cleanWa;

      const waMessage = encodeURIComponent(
        `Halo Admin, saya ingin konfirmasi pencairan Tarik Tunai / Gestun.\n\n` +
          `📌 Invoice: ${invoiceNumber}\n` +
          `👤 Nama Pemohon: ${orderData.customerName || "-"}\n` +
          `💰 Nominal: Rp ${Number(orderData.amount || orderData.price || 0).toLocaleString("id-ID")}\n` +
          `🏦 Rekening Tujuan: ${orderData.gestunDetails?.bankName || "-"} (${orderData.gestunDetails?.accountNumber || "-"}) a.n ${orderData.gestunDetails?.accountHolder || "-"}\n\n` +
          `Mohon segera diproses pencairannya. Terima kasih!`
      );

      const waConfirmUrl = `https://wa.me/${formattedWa}?text=${waMessage}`;

      actionButtonHtml = `
        <a href="${waConfirmUrl}" target="_blank" rel="noopener noreferrer" class="btn-action btn-wa">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:8px;">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          Konfirmasi Tarik Tunai via WhatsApp
        </a>
        <p class="instruction">Klik tombol di atas untuk konfirmasi & verifikasi pencairan dana ke WhatsApp Admin.</p>
      `;
    } else if (productType === "ACCESS") {
      actionButtonHtml = `
        <a href="${targetAppUrl}" target="_blank" class="btn-action btn-access">Buka Aplikasi / Login</a>
        <p class="instruction">${hasLicense ? "Gunakan Kode Lisensi dan Email Anda untuk login ke dalam aplikasi." : "Silakan klik tombol di atas untuk mengakses aplikasi."}</p>
      `;
    } else {
      actionButtonHtml = `
        <a href="/api/download/${telegramFileId || "default"}" class="btn-action btn-download">Unduh File Produk</a>
        <p class="instruction">${hasLicense ? "Gunakan Kode Lisensi di atas saat menjalankan installer/aplikasi." : "Klik tombol di atas untuk mulai mengunduh file."}</p>
      `;
    }

    // 7. Render Halaman HTML Rapi
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Akses Produk - STORE Engine</title>
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
            display: flex;
            align-items: center;
            justify-content: center; 
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
          .btn-wa { background: #25D366; }
          .btn-wa:hover { background: #1eb954; }
          .instruction { font-size: 0.8rem; color: #64748b; margin-top: 12px; margin-bottom: 0; line-height: 1.4; }
          .footer { margin-top: 24px; font-size: 0.8rem; color: #64748b; border-top: 1px solid #334155; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="badge">PEMBAYARAN BERHASIL</span>
          <h1>${orderData.productName || "Gestun Tarik Tunai"} - Rp ${Number(orderData.amount || orderData.price || 0).toLocaleString("id-ID")}</h1>
          <p class="sub">Terima kasih! Pembelian Anda telah dikonfirmasi.</p>
          
          ${licenseHtml}
          
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
