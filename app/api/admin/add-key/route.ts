import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { adminPassword, productId, serialKey } = await request.json();
    const envAdminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (adminPassword !== envAdminPassword) {
      return NextResponse.json(
        { success: false, message: "Password Admin Salah!" },
        { status: 401 }
      );
    }

    if (!productId || !serialKey) {
      return NextResponse.json(
        { success: false, message: "Product ID dan Serial Key wajib diisi!" },
        { status: 400 }
      );
    }

    const docRef = db.collection("products").doc(productId);

    // HANYA menambah kunci ke array manualKeys tanpa merubah field lain (seperti telegramFileId, price, name, dll)
    await docRef.update({
      manualKeys: FieldValue.arrayUnion(serialKey.trim().toUpperCase()),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Serial key '${serialKey}' berhasil ditambahkan ke produk '${productId}'!`,
    });
  } catch (error: any) {
    console.error("Add Key Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error: " + error.message },
      { status: 500 }
    );
  }
}
