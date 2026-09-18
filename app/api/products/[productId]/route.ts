import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID diperlukan." },
        { status: 400 }
      );
    }

    const productDoc = await adminDb.collection("products").doc(productId).get();

    if (!productDoc.exists) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan." },
        { status: 404 }
      );
    }

    const data = productDoc.data();

    if (data?.status !== "active") {
      return NextResponse.json(
        { error: "Produk tidak aktif atau tidak tersedia." },
        { status: 403 }
      );
    }

    const publicProductData = {
      id: productDoc.id,
      name: data.name,
      price: Number(data.price),
      type: data.type,
      description: data.description || "",
      version: data.version || "1.0",
      imageUrl: data.imageUrl || "",
      durationDays: data.type === "online" ? data.durationDays : undefined,
    };

    return NextResponse.json(publicProductData, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Gagal mengambil data produk.", details: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
