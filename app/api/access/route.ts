import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/security/auth-guard";

// 1. Memaksa API menjadi Serverless Dynamic Route (Bukan Static)
export const dynamic = "force-dynamic";

// 2. Memaksa API dijalankan di Node.js Runtime (Bukan Edge Engine)
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    // Otentikasi User via ID Token
    const user = await verifyAuthToken(req);

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { allowed: false, error: "Parameter productId dibutuhkan." },
        { status: 400 }
      );
    }

    // Cari Record Akses spesifik untuk (userId + productId)
    const accessId = `ACC-${user.uid}-${productId}`;
    const accessRef = adminDb.collection("access").doc(accessId);
    const accessSnap = await accessRef.get();

    if (!accessSnap.exists) {
      return NextResponse.json({
        allowed: false,
        status: "NO_ACCESS",
        message: "Anda belum memiliki akses/lisensi untuk produk ini.",
      });
    }

    const accessData = accessSnap.data();

    // Evaluasi Status & Tanggal Kadaluarsa
    const now = new Date();
    const expiredAt = new Date(accessData?.expiredAt);

    if (accessData?.status !== "ACTIVE") {
      return NextResponse.json({
        allowed: false,
        status: accessData?.status,
        message: "Akses tidak aktif atau telah dicabut.",
      });
    }

    if (now > expiredAt) {
      await accessRef.update({ status: "EXPIRED" });

      return NextResponse.json({
        allowed: false,
        status: "EXPIRED",
        message: "Masa berlaku akses telah habis. Silakan perbarui langganan Anda.",
      });
    }

    // Ambil Detail Aplikasi untuk Redirect/Sesi Online
    const productSnap = await adminDb.collection("products").doc(productId).get();
    const productData = productSnap.data();

    return NextResponse.json({
      allowed: true,
      status: "ACTIVE",
      appUrl: productData?.appUrl || "",
      expiredAt: accessData?.expiredAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { allowed: false, error: error.message },
      { status: 401 }
    );
  }
}
