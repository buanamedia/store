import { NextResponse } from "next/server";
// Impor db firestore Anda di sini jika menggunakan Firebase
// import { db } from "@/lib/firebase"; 

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get("password");

    // Validasi Password Admin
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, message: "Password Salah!" }, { status: 401 });
    }

    // Ambil data transaksi dari Firestore (sesuaikan dengan koleksi database Anda)
    // const snapshot = await db.collection("transactions").orderBy("createdAt", "desc").get();
    // const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Contoh data dummy jika belum terhubung ke database transaksi:
    const transactions: any[] = [];

    return NextResponse.json({ success: true, transactions });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
