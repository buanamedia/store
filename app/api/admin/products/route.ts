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
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, message: "Server Error: " + errMessage },
      { status: 500 }
    );
  }
}

// 2. POST: Simpan / Update Konfigurasi Produk ke Firestore
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      adminPassword,
      id,
      name,
      price,
      type,
      hasLicense,
      licenseMode,
      manualKeys,
      generatorApiUrl,
      appUrl,
      telegramFileId,
    } = body;

    const envAdminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (adminPassword !== envAdminPassword) {
      return NextResponse.json(
        { success: false, message: "Password Admin Salah!" },
        { status: 401 }
      );
    }

    const cleanPrice = Math.round(Number(price) || 0);

    if (!id || !name || isNaN(cleanPrice) || cleanPrice <= 0) {
      return NextResponse.json(
        { success: false, message: "ID Produk, Nama, dan Harga Valid wajib diisi!" },
        { status: 400 }
      );
    }

    const formattedManualKeys = typeof manualKeys === "string"
      ? manualKeys.split(/[\n,]+/).map((k: string) => k.trim()).filter((k: string) => k.length > 0)
      : [];

    const productPayload: Record<string, unknown> = {
      name,
      price: cleanPrice,
      type,
      hasLicense: Boolean(hasLicense),
      licenseMode: hasLicense ? licenseMode : "NONE",
      updatedAt: new Date().toISOString(),
    };

    if (hasLicense) {
      if (licenseMode === "MANUAL") {
        productPayload.manualKeys = formattedManualKeys;
      } else if (licenseMode === "GENERATOR") {
        productPayload.generatorApiUrl = generatorApiUrl || "";
      }
    }

    if (type === "ACCESS") {
      productPayload.appUrl = appUrl || "";
    } else if (type === "DOWNLOAD") {
      productPayload.telegramFileId = telegramFileId || "";
    }

    await db.collection("products").doc(id).set(productPayload, { merge: true });

    return NextResponse.json({
      success: true,
      message: "Produk berhasil disimpan!",
      productId: id,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Admin Product Creation Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error: " + errMessage },
      { status: 500 }
    );
  }
}

// 3. DELETE: Hapus Produk dari Firestore & Pesan Telegram (jika ada)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const adminPasswordInput = searchParams.get("password");
    const envAdminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (adminPasswordInput !== envAdminPassword) {
      return NextResponse.json(
        { success: false, message: "Password Admin Salah!" },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID Produk tidak ditemukan!" },
        { status: 400 }
      );
    }

    const docRef = db.collection("products").doc(id);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const pData = docSnap.data();
      
      if (pData?.telegramMessageId && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        try {
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/deleteMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: process.env.TELEGRAM_CHAT_ID,
              message_id: pData.telegramMessageId,
            }),
          });
        } catch (tgErr) {
          console.error("Gagal hapus pesan Telegram:", tgErr);
        }
      }

      await docRef.delete();
    }

    return NextResponse.json({
      success: true,
      message: `Produk '${id}' berhasil dihapus dari database!`,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, message: "Server Error: " + errMessage },
      { status: 500 }
    );
  }
}
