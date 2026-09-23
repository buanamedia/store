import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

// GET: Ambil Semua Transaksi dari Koleksi 'orders'
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get("password");

    // Validasi Password Admin
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, message: "Password Salah!" }, { status: 401 });
    }

    let transactions: any[] = [];

    try {
      const snapshot = await db.collection("orders").get();

      if (snapshot && snapshot.docs) {
        transactions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      }
    } catch (dbError: any) {
      console.error("Firestore Error:", dbError.message);
      transactions = [];
    }

    return NextResponse.json({ success: true, transactions });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE: Hapus Transaksi Berdasarkan ID Dokumen di Koleksi 'orders'
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get("password");
    const id = searchParams.get("id");

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, message: "Password Salah!" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ success: false, message: "ID Transaksi tidak ditemukan." }, { status: 400 });
    }

    await db.collection("orders").doc(id).delete();

    return NextResponse.json({ success: true, message: `Transaksi ${id} berhasil dihapus.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
