import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
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

// 2. HAPUS SERIAL KEY SPESIFIK (ARRAY REMOVE)
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

    const docRef = db.collection("products").doc(productId);

    await docRef.update({
      manualKeys: FieldValue.arrayRemove(serialKey.trim().toUpperCase()),
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
