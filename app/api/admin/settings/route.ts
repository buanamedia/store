import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// GET: Membaca Pengaturan Tampilan Toko dari Firestore
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get("password");

    // Verifikasi Password Admin
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, message: "Password admin tidak valid!" },
        { status: 401, headers: corsHeaders }
      );
    }

    const docSnap = await db.collection("settings").doc("store").get();

    if (docSnap.exists) {
      return NextResponse.json(
        { success: true, settings: docSnap.data() },
        { headers: corsHeaders }
      );
    } else {
      // Default Settings jika dokumen belum ada
      const defaultSettings = {
        headerTitle: "STORE Engine",
        headerIcon: "🛒",
        gridColumns: 4,
        widgetPosition: "BELOW_CAROUSEL",
        footerText: "© PT Buana Media Bersama. All rights reserved.",
      };

      return NextResponse.json(
        { success: true, settings: defaultSettings },
        { headers: corsHeaders }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal membaca pengaturan: " + error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST: Menyimpan Pengaturan Tampilan Toko ke Firestore
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
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
        { status: 401, headers: corsHeaders }
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

    // Simpan ke Firestore
    await db.collection("settings").doc("store").set(payload, { merge: true });

    return NextResponse.json(
      {
        success: true,
        message: "Pengaturan tampilan berhasil diperbarui!",
        settings: payload,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan pengaturan: " + error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
