import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const { serialKey, deviceId } = await request.json();

    if (!serialKey) {
      return NextResponse.json(
        { valid: false, message: "Serial Key wajib diisi!" },
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanKey = serialKey.trim().toUpperCase();

    // 1. Cek Kunci di Collection 'licenses' (Lisensi yang sudah dibeli & di-generate)
    const licenseSnapshot = await db
      .collection("licenses")
      .where("licenseKey", "==", cleanKey)
      .limit(1)
      .get();

    if (licenseSnapshot.empty) {
      return NextResponse.json(
        { valid: false, message: "Serial Key tidak terdaftar atau belum diaktivasi!" },
        { status: 200, headers: corsHeaders }
      );
    }

    const licenseDoc = licenseSnapshot.docs[0];
    const licenseData = licenseDoc.data();

    // 2. Cek Status Lisensi
    if (licenseData.status !== "ACTIVE") {
      return NextResponse.json(
        { valid: false, message: "Lisensi ini telah dinonaktifkan oleh Admin!" },
        { status: 200, headers: corsHeaders }
      );
    }

    // 3. Logika Bind Perangkat (Device Binding)
    let deviceList: string[] = Array.isArray(licenseData.deviceIds) ? licenseData.deviceIds : [];
    const maxDevices = licenseData.maxDevices || 1;

    if (deviceId && !deviceList.includes(deviceId)) {
      if (deviceList.length >= maxDevices) {
        return NextResponse.json(
          { valid: false, message: `Lisensi telah mencapai batas maksimal (${maxDevices} Device)!` },
          { status: 200, headers: corsHeaders }
        );
      }

      deviceList.push(deviceId);
      await licenseDoc.ref.update({ deviceIds: deviceList });
    }

    return NextResponse.json(
      {
        valid: true,
        licenseKey: cleanKey,
        message: "Aktivasi berhasil & terverifikasi!",
      },
      { headers: corsHeaders }
    );

  } catch (error: any) {
    console.error("Check License Error:", error);
    return NextResponse.json(
      { valid: false, message: "Server Error: " + error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
