import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const price = Number(formData.get("price"));
    const type = formData.get("type") as string; // "DOWNLOAD" atau "ACCESS"
    const hasLicense = formData.get("hasLicense") === "true";
    const appUrl = (formData.get("appUrl") as string) || "";
    const file = formData.get("file") as File | null;

    if (!id || !name || isNaN(price)) {
      return NextResponse.json(
        { success: false, message: "ID Produk, Nama, dan Harga wajib diisi!" },
        { status: 400 }
      );
    }

    let telegramFileId = "";

    // 1. Jika tipe DOWNLOAD dan ada file yang diunggah, kirim file ke Telegram Bot API
    if (type === "DOWNLOAD" && file && file.size > 0) {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      if (!botToken || !chatId) {
        return NextResponse.json(
          { success: false, message: "TELEGRAM_BOT_TOKEN atau TELEGRAM_CHAT_ID belum diset di Vercel!" },
          { status: 500 }
        );
      }

      // Buat Form Data untuk Telegram API sendDocument
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

      // Ambil file_id dari respon Telegram
      telegramFileId = tgData.result.document.file_id;
    }

    // 2. Simpan atau Update Data Produk ke Firestore
    const productPayload: Record<string, any> = {
      name,
      price,
      type,
      hasLicense,
      updatedAt: new Date().toISOString(),
    };

    if (type === "ACCESS") {
      productPayload.appUrl = appUrl;
    } else if (type === "DOWNLOAD") {
      if (telegramFileId) {
        productPayload.telegramFileId = telegramFileId;
      }
    }

    await db.collection("products").doc(id).set(productPayload, { merge: true });

    return NextResponse.json({
      success: true,
      message: "Produk berhasil disimpan ke Firestore!",
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
