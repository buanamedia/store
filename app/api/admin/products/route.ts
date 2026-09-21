import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Masukkan URL Deployment Web App Apps Script Anda di sini
const GAS_WEBAPP_URL = process.env.GAS_WEBAPP_URL || "URL_APPS_SCRIPT_ANDA";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminPasswordInput = searchParams.get("password");
    const envAdminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (adminPasswordInput !== envAdminPassword) {
      return NextResponse.json({ success: false, message: "Password Admin Salah!" }, { status: 401 });
    }

    const productsSnapshot = await db.collection("products").get();
    const products = productsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Server Error: " + error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const adminPasswordInput = formData.get("adminPassword") as string;
    const envAdminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (adminPasswordInput !== envAdminPassword) {
      return NextResponse.json({ success: false, message: "Password Admin Salah!" }, { status: 401 });
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
    let telegramFileId = (formData.get("telegramFileId") as string) || "";
    const file = formData.get("file") as File | null;

    if (!id || !name || isNaN(price)) {
      return NextResponse.json({ success: false, message: "ID Produk, Nama, dan Harga wajib diisi!" }, { status: 400 });
    }

    // Jika tipe DOWNLOAD dan ada File yang diunggah, kirim ke Apps Script
    if (type === "DOWNLOAD" && file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const base64File = Buffer.from(arrayBuffer).toString("base64");

      const gasRes = await fetch(GAS_WEBAPP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secretKey: "gpfadmin123",
          fileName: file.name,
          category: "ZIP",
          fileData: base64File,
        }),
      });

      const gasData = await gasRes.json();

      if (!gasRes.ok || !gasData.success) {
        return NextResponse.json(
          { success: false, message: "Gagal Upload via GAS: " + (gasData.message || "Error") },
          { status: 500 }
        );
      }

      telegramFileId = gasData.telegramFileId;
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
      if (licenseMode === "MANUAL") productPayload.manualKeys = manualKeys;
      if (licenseMode === "GENERATOR") productPayload.generatorApiUrl = generatorApiUrl;
    }

    if (type === "ACCESS") {
      productPayload.appUrl = appUrl;
    } else if (type === "DOWNLOAD") {
      productPayload.telegramFileId = telegramFileId;
    }

    await db.collection("products").doc(id).set(productPayload, { merge: true });

    return NextResponse.json({
      success: true,
      message: "Produk berhasil disimpan & terunggah ke Telegram via GAS!",
      productId: id,
      telegramFileId,
    });
  } catch (error: any) {
    console.error("Admin Product Error:", error);
    return NextResponse.json({ success: false, message: "Server Error: " + error.message }, { status: 500 });
  }
}
