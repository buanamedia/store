import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/security/auth-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const user = await verifyAuthToken(req);

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { allowed: false, error: "Parameter productId dibutuhkan." },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
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
