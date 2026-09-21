import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

// 1. GET: Ambil Semua Daftar Produk dari Firestore
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminPasswordInput = searchParams.get("password");
    const envAdminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (adminPasswordInput !== envAdminPassword) {
      return NextResponse.json(
        { success: false, message: "Password Admin Salah!" },
        { status: 401 }
      );
    }

    const productsSnapshot = await db.collection("products").get();
    const products = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Server Error: " + error.message },
      { status: 500 }
    );
  }
}

// 2. POST: Tambah / Update Produk ke Firestore + Telegram Upload
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const adminPasswordInput = formData.get("adminPassword") as string;
    const envAdminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (adminPasswordInput !== envAdminPassword) {
      return NextResponse.json(
        { success: false, message: "Password Admin Salah!" },
        { status: 401 }
      );
    }

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const price = Number(formData.get("price"));
    const type = formData.get("type") as string;
    const hasLicense = formData.get("hasLicense") === "true";
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
    });
  } catch (error: any) {
    console.error("Admin Product Creation Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error: " + error.message },
      { status: 500 }
    );
  }
}
