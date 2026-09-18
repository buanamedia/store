export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/security/auth-guard";
import { Product } from "@/types/product";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const user = await verifyAuthToken(req);
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: "FORBIDDEN: Akses khusus Admin." },
        { status: 403 }
      );
    }

    const adminDb = getAdminDb();
    const snapshot = await adminDb
      .collection("products")
      .orderBy("createdAt", "desc")
      .get();
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await verifyAuthToken(req);
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: "FORBIDDEN: Akses khusus Admin." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      id,
      name,
      type,
      price,
      description,
      version,
      imageUrl,
      status,
      durationDays,
      appUrl,
      telegramFileId,
      telegramMessageId,
    } = body;

    if (!id || !name || !type || price === undefined) {
      return NextResponse.json(
        { error: "ID, Nama, Tipe, dan Harga wajib diisi." },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    const productRef = adminDb.collection("products").doc(id);
    const docSnap = await productRef.get();

    if (docSnap.exists) {
      return NextResponse.json(
        { error: "Product ID sudah digunakan." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const newProduct: Product = {
      id,
      name,
      type,
      price: Number(price),
      description: description || "",
      version: version || "1.0",
      imageUrl: imageUrl || "",
      status: status || "active",
      durationDays: type === "online" ? Number(durationDays || 30) : undefined,
      appUrl: type === "online" ? appUrl || "" : undefined,
      telegramFileId: type === "download" ? telegramFileId || "" : undefined,
      telegramMessageId:
        type === "download" ? telegramMessageId || "" : undefined,
      createdAt: now,
      updatedAt: now,
    };

    await productRef.set(newProduct);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
