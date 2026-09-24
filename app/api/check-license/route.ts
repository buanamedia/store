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
    const { serialKey, deviceId, productId } = await request.json();

    if (!serialKey) {
      return NextResponse.json(
        { valid: false, message: "Serial Key wajib diisi!" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { valid: false, message: "Product ID tidak valid / tidak dikirim!" },
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanKey = serialKey.trim().toUpperCase();

    // =========================================================================
    // SKENARIO A: Cek di collection 'licenses' (Pembelian Otomatis Store)
    // =========================================================================
    const licenseSnapshot = await db
      .collection("licenses")
      .where("licenseKey", "==", cleanKey)
      .limit(1)
      .get();

    if (!licenseSnapshot.empty) {
      const licenseDoc = licenseSnapshot.docs[0];
      const licenseData = licenseDoc.data();

      if (licenseData.productId !== productId) {
        return NextResponse.json(
          { valid: false, message: "Serial Key ini terdaftar untuk produk lain!" },
          { status: 200, headers: corsHeaders }
        );
      }

      if (licenseData.status !== "ACTIVE" && licenseData.is_active === false) {
        return NextResponse.json(
          { valid: false, message: "Lisensi ini telah dinonaktifkan!" },
          { status: 200, headers: corsHeaders }
        );
      }

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
          message: "Aktivasi lisensi berhasil & terverifikasi!",
        },
        { headers: corsHeaders }
      );
    }

    // =========================================================================
    // SKENARIO B: Cek di collection 'products' (Stok Lisensi Input Manual)
    // =========================================================================
    const productDoc = await db.collection("products").doc(productId).get();

    if (productDoc.exists) {
      const productData = productDoc.data();

      if (productData?.hasLicense !== false && Array.isArray(productData?.manualKeys)) {
        const manualKeys: string[] = productData.manualKeys.map((k: string) => k.trim().toUpperCase());

        if (manualKeys.includes(cleanKey)) {
          let registeredManualDevices: Record<string, string[]> = productData.registeredManualDevices || {};
          let usedManualKeys: string[] = Array.isArray(productData.usedManualKeys) ? productData.usedManualKeys : [];

          let keyDeviceList: string[] = Array.isArray(registeredManualDevices[cleanKey]) 
            ? registeredManualDevices[cleanKey] 
            : [];

          const maxDevicesPerKey = 1;

          if (deviceId && !keyDeviceList.includes(deviceId)) {
            if (keyDeviceList.length >= maxDevicesPerKey) {
              return NextResponse.json(
                { valid: false, message: `Serial Key '${cleanKey}' telah digunakan di device lain!` },
                { status: 200, headers: corsHeaders }
              );
            }

            keyDeviceList.push(deviceId);
            registeredManualDevices[cleanKey] = keyDeviceList;
          }

          // Otomatis tandai kunci sebagai terpakai di usedManualKeys
          if (!usedManualKeys.includes(cleanKey)) {
            usedManualKeys.push(cleanKey);
          }

          // CATAT PERUBAHAN KE FIRESTORE DOKUMEN PRODUK
          await productDoc.ref.update({
            registeredManualDevices,
            usedManualKeys,
            updatedAt: new Date().toISOString()
          });

          return NextResponse.json(
            {
              valid: true,
              licenseKey: cleanKey,
              message: "Aktivasi Serial Key produk berhasil!",
            },
            { headers: corsHeaders }
          );
        }
      }
    }

    // =========================================================================
    // SKENARIO C: Key Tidak Ditemukan
    // =========================================================================
    return NextResponse.json(
      { valid: false, message: "Serial Key tidak terdaftar atau tidak sesuai!" },
      { status: 200, headers: corsHeaders }
    );

  } catch (error: any) {
    console.error("Check License Error:", error);
    return NextResponse.json(
      { valid: false, message: "Server Error: " + error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
