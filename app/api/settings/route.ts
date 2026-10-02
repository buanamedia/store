import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// GET: Membaca Pengaturan Tampilan Toko Publik (Tanpa Password Admin)
export async function GET() {
  try {
    const docSnap = await db.collection("settings").doc("store").get();

    if (docSnap.exists) {
      return NextResponse.json(
        { success: true, settings: docSnap.data() },
        { headers: corsHeaders }
      );
    } else {
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
