import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/security/auth-guard";
import { createDokuInvoice } from "@/lib/doku/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await verifyAuthToken(req);

    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID wajib diisi." }, { status: 400 });
    }

    const productDoc = await adminDb.collection("products").doc(productId).get();

    if (!productDoc.exists) {
      return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    }

    const product = productDoc.data();

    if (product?.status !== "active") {
      return NextResponse.json({ error: "Produk tidak aktif." }, { status: 400 });
    }

    const orderId = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const dokuResponse = await createDokuInvoice({
      orderId,
      amount: Number(product.price),
      productName: product.name,
      customerEmail: user.email || "user@example.com",
    });

    const paymentUrl = dokuResponse.response?.payment?.url || dokuResponse.paymentUrl;

    const newOrder = {
      orderId,
      userId: user.uid,
      productId,
      productName: product.name,
      amount: Number(product.price),
      currency: "IDR",
      status: "PENDING",
      dokuInvoiceNumber: orderId,
      paymentUrl: paymentUrl || "",
      createdAt: now,
      paidAt: null,
      expiredAt: null,
    };

    await adminDb.collection("orders").doc(orderId).set(newOrder);

    return NextResponse.json({
      success: true,
      orderId,
      paymentUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
