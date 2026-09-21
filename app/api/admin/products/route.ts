import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Verifikasi Password Admin
    const adminPasswordInput = formData.get("adminPassword") as string;
    const envAdminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (adminPasswordInput !== envAdminPassword) {
      return NextResponse.json(
        { success: false, message: "Password Admin Salah/Sesi Tidak Valid!" },
        { status: 401 }
      );
    }

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const price = Number(formData.get("price"));
    const type = formData.get("type") as string; // "DOWNLOAD" atau "ACCESS"
    const hasLicense = formData.get("hasLicense") === "true";
    
    // Mode Lisensi: "AUTO", "MANUAL", atau "GENERATOR"
    const licenseMode = (formData.get("licenseMode") as string) || "AUTO"; 
    const manualKeysRaw = (formData.get("manualKeys") as string) || "";
    const generatorApiUrl = (formData.get("generatorApiUrl") as string) || "";

    const appUrl = (formData.get("appUrl") as string) || "";
    const file = formData.get("file") as File | null;

    if (!id || !name || isNaN(price)) {
      return NextResponse.json(
        { success: false, message: "ID Produk, Nama, dan Harga wajib diisi!" },
        { status: 400 }
      );
    }

    let telegramFileId = "";

    // Unggah file ke Telegram jika tipe DOWNLOAD
    if (type === "DOWNLOAD" && file && file.size > 0) {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      if (!botToken || !chatId) {
        return NextResponse.json(
          { success: false, message: "TELEGRAM_BOT_TOKEN atau TELEGRAM_CHAT_ID belum diset di Vercel!" },
          { status: 500 }
        );
      }

      const tgFormData = new FormData();
      tgFormData.append("chat_id", chatId);
      tgFormData.append("document", file, file.name);

      const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
        method: "POST",
        body: tgFormData,
      });

      const tgData = await tgRes.json();

      if (!tgRes.ok || !tgData.ok) {
        return NextResponse.json(
          { success: false, message: "Gagal unggah file ke Telegram: " + (tgData.description || "Error") },
          { status: 500 }
        );
      }

      telegramFileId = tgData.result.document.file_id;
    }

    // Format array lisensi manual jika diisi
    const manualKeys = manualKeysRaw
      .split(/[\n,]+/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const productPayload: Record<string, any> = {
      name,
      price,
      type,
      hasLicense,
      licenseMode: hasLicense ? licenseMode : "NONE",
      updatedAt: new Date().toISOString(),
    };

    if (hasLicense) {
      if (licenseMode === "MANUAL") {
        productPayload.manualKeys = manualKeys;
      } else if (licenseMode === "GENERATOR") {
        productPayload.generatorApiUrl = generatorApiUrl;
      }
    }

    if (type === "ACCESS") {
      productPayload.appUrl = appUrl;
    } else if (type === "DOWNLOAD" && telegramFileId) {
      productPayload.telegramFileId = telegramFileId;
    }

    await db.collection("products").doc(id).set(productPayload, { merge: true });

    return NextResponse.json({
      success: true,
      message: "Produk & Konfigurasi Lisensi berhasil disimpan!",
      productId: id,
      telegramFileId: telegramFileId || undefined,
    });
  } catch (error: any) {
    console.error("Admin Product Creation Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error: " + error.message },
      { status: 500 }
    );
  }
}
