import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // Jalur impor sesuai folder lib di root proyek Anda

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get("password");

    // Validasi Password Admin
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, message: "Password Salah!" }, { status: 401 });
    }

    // Ambil data transaksi dari Firestore
    let transactions: any[] = [];

    try {
      // Mengambil dari koleksi 'transactions' (Urutkan dari terbaru jika ada bidang 'createdAt')
      const snapshot = await db.collection("transactions").get();
      
      transactions = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (dbError: any) {
      console.error("Firestore Fetch Error:", dbError);
      // Mengembalikan array kosong jika koleksi belum ada/kosong tanpa memicu error build
      transactions = [];
    }

    return NextResponse.json({ success: true, transactions });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
