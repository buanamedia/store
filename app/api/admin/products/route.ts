import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminPassword, id, name, price, type, hasLicense, licenseMode, manualKeys, generatorApiUrl, appUrl, telegramFileId } = body;

    const envAdminPassword = process.env.ADMIN_PASSWORD || "admin123";
    if (adminPassword !== envAdminPassword) {
      return NextResponse.json(
        { success: false, message: "Password Admin Salah!" },
        { status: 401 }
      );
    }

    if (!id || !name || isNaN(Number(price))) {
      return NextResponse.json(
        { success: false, message: "ID Produk, Nama, dan Harga wajib diisi!" },
        { status: 400 }
      );
    }

    const formattedManualKeys = typeof manualKeys === "string" 
      ? manualKeys.split(/[\n,]+/).map((k: string) => k.trim()).filter((k: string) => k.length > 0)
      : [];

    const productPayload: Record<string, any> = {
      name,
      price: Number(price),
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
      message: "Produk berhasil disimpan ke Firestore!",
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
