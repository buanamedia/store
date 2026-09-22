import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const productId = params.id;
    const doc = await db.collection("products").doc(productId).get();

    if (!doc.exists) {
      return NextResponse.json({ success: false, message: "Produk tidak ditemukan" }, { status: 404, headers: corsHeaders });
    }

    const data = doc.data();
    
    // Hitung sisa stok jika mode MANUAL
    let isOutOfStock = false;
    if (data?.hasLicense !== false && data?.licenseMode === "MANUAL") {
      let keys: string[] = [];
      if (Array.isArray(data?.manualKeys)) {
        keys = data.manualKeys;
      } else if (typeof data?.manualKeys === "string") {
        keys = data.manualKeys.split("\n").map((k: string) => k.trim()).filter(Boolean);
      }
      if (keys.length === 0) {
        isOutOfStock = true;
      }
    }

    return NextResponse.json({
      success: true,
      product: {
        id: doc.id,
        name: data?.name,
        price: data?.price,
        isOutOfStock,
      }
    }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500, headers: corsHeaders });
  }
}
