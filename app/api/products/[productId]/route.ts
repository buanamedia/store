import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/security/auth-guard";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const user = await verifyAuthToken(req);
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: "FORBIDDEN: Akses khusus Admin." },
        { status: 403 }
      );
    }

    const { productId } = params;
    const body = await req.json();

    const productRef = adminDb.collection("products").doc(productId);
    const docSnap = await productRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan." },
        { status: 404 }
      );
    }

    const updateData = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await productRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: "Produk berhasil diperbarui.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const user = await verifyAuthToken(req);
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: "FORBIDDEN: Akses khusus Admin." },
        { status: 403 }
      );
    }

    const { productId } = params;
    await adminDb.collection("products").doc(productId).delete();

    return NextResponse.json({
      success: true,
      message: "Produk berhasil dihapus.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
