import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // Sesuaikan jalur impor inisialisasi firebase Anda

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get("password");

    // Validasi Password Admin
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, message: "Password Salah!" }, { status: 401 });
    }

    // Ambil data transaksi dari Firestore (pastikan nama koleksi 'transactions' sesuai dengan database Anda)
    const snapshot = await db.collection("transactions").orderBy("createdAt", "desc").get();
    const transactions = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));

    return NextResponse.json({ success: true, transactions });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
