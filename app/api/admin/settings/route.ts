import { NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// Konfigurasi Firebase Project Anda
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inisialisasi Firebase App & Firestore
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// GET: Membaca Pengaturan Tampilan Toko dari Firestore
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get("password");

    // Verifikasi Password Admin dari Environment Variable
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, message: "Password admin tidak valid!" },
        { status: 401 }
      );
    }

    const docRef = doc(db, "settings", "store");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return NextResponse.json({
        success: true,
        settings: docSnap.data(),
      });
    } else {
      // Default Settings jika dokumen belum ada di Firestore
      const defaultSettings = {
        headerTitle: "STORE Engine",
        headerIcon: "🛒",
        gridColumns: 4,
        widgetPosition: "BELOW_CAROUSEL",
        footerText: "© PT Buana Media Bersama. All rights reserved.",
      };

      return NextResponse.json({
        success: true,
        settings: defaultSettings,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal membaca pengaturan: " + error.message },
      { status: 500 }
    );
  }
}

// POST: Menyimpan Pengaturan Tampilan Toko ke Firestore
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      adminPassword,
      headerTitle,
      headerIcon,
      gridColumns,
      widgetPosition,
      footerText,
    } = body;

    // Verifikasi Password Admin
    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, message: "Password admin tidak valid!" },
        { status: 401 }
      );
    }

    const payload = {
      headerTitle: headerTitle || "STORE Engine",
      headerIcon: headerIcon || "🛒",
      gridColumns: Number(gridColumns) || 4,
      widgetPosition: widgetPosition || "BELOW_CAROUSEL",
      footerText: footerText || "© PT Buana Media Bersama. All rights reserved.",
      updatedAt: new Date().toISOString(),
    };

    // Simpan/Update Dokumen di Koleksi 'settings', Dokumen ID 'store'
    const docRef = doc(db, "settings", "store");
    await setDoc(docRef, payload, { merge: true });

    return NextResponse.json({
      success: true,
      message: "Pengaturan tampilan berhasil diperbarui!",
      settings: payload,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan pengaturan: " + error.message },
      { status: 500 }
    );
  }
}
