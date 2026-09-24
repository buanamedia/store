import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// 1. TAMBAH SERIAL KEY BARU (ARRAY UNION)
export async function POST(request: Request) {
  try {
    const { adminPassword, productId, serialKey } = await request.json();
    const envAdminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (adminPassword !== envAdminPassword) {
      return NextResponse.json(
        { success: false, message: "Password Admin Salah!" },
        { status: 401, headers: corsHeaders }
      );
    }

    if (!productId || !serialKey) {
      return NextResponse.json(
        { success: false, message: "Product ID dan Serial Key wajib diisi!" },
        { status: 400, headers: corsHeaders }
      );
    }

    const docRef = db.collection("products").doc(productId);

    await docRef.update({
      manualKeys: FieldValue.arrayUnion(serialKey.trim().toUpperCase()),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, message: "Serial Key berhasil ditambahkan!" },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Server Error: " + error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// 2. HAPUS SERIAL KEY SPESIFIK (BERSIHKAN SEMUA RECORDNYA)
export async function DELETE(request: Request) {
  try {
    const { adminPassword, productId, serialKey } = await request.json();
    const envAdminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (adminPassword !== envAdminPassword) {
      return NextResponse.json(
        { success: false, message: "Password Admin Salah!" },
        { status: 401, headers: corsHeaders }
      );
    }

    const cleanKey = serialKey.trim().toUpperCase();
    const docRef = db.collection("products").doc(productId);

    await docRef.update({
      manualKeys: FieldValue.arrayRemove(cleanKey),
      usedManualKeys: FieldValue.arrayRemove(cleanKey),
      [`registeredManualDevices.${cleanKey}`]: FieldValue.delete(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, message: "Serial Key berhasil dihapus!" },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Server Error: " + error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// 3. UBAH STATUS SERIAL KEY (RESET TO UNUSED / SET TO USED)
export async function PATCH(request: Request) {
  try {
    const { adminPassword, productId, serialKey, action } = await request.json();
    const envAdminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (adminPassword !== envAdminPassword) {
      return NextResponse.json(
        { success: false, message: "Password Admin Salah!" },
        { status: 401, headers: corsHeaders }
      );
    }

    const cleanKey = serialKey.trim().toUpperCase();
    const docRef = db.collection("products").doc(productId);

    if (action === "RESET_UNUSED") {
      // Menjadikan BELUM TERPAKAI (Reset device binding & hapus dari usedManualKeys)
      await docRef.update({
        usedManualKeys: FieldValue.arrayRemove(cleanKey),
        [`registeredManualDevices.${cleanKey}`]: FieldValue.delete(),
        updatedAt: new Date().toISOString(),
      });
    } else if (action === "SET_USED") {
      // Menjadikan TERPAKAI DI DEVICE
      await docRef.update({
        usedManualKeys: FieldValue.arrayUnion(cleanKey),
        [`registeredManualDevices.${cleanKey}`]: ["MANUAL_ADMIN_LOCK"],
        updatedAt: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Aksi tidak valid!" },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true, message: "Status serial key berhasil diperbarui!" },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Server Error: " + error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
