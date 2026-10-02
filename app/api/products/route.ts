import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET() {
  try {
    const snapshot = await db.collection("products").get();

    const products = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        imageUrl: data.imageUrl || "",
        blogUrl: data.blogUrl || "",
        showInCarousel: data.showInCarousel !== false,
      };
    });

    return NextResponse.json(
      { success: true, products },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data produk: " + error.message, products: [] },
      { status: 500, headers: corsHeaders }
    );
  }
}
