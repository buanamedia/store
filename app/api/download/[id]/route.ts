import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params.id;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!fileId || !botToken) {
      return NextResponse.json(
        { success: false, message: "Konfigurasi file tidak valid" },
        { status: 400 }
      );
    }

    // 1. Minta File Path ke Telegram API
    const getPathUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`;
    const pathRes = await fetch(getPathUrl);
    const pathData = await pathRes.json();

    if (!pathData.ok) {
      return NextResponse.json(
        { success: false, message: "File tidak ditemukan di storage Telegram" },
        { status: 404 }
      );
    }

    const filePath = pathData.result.file_path;
    const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

    // 2. Fetch stream file dari Telegram
    const fileRes = await fetch(downloadUrl);

    if (!fileRes.ok) {
      return NextResponse.json(
        { success: false, message: "Gagal mengunduh file dari storage" },
        { status: 500 }
      );
    }

    // 3. Forward stream file langsung ke client
    const headers = new Headers();
    headers.set("Content-Type", fileRes.headers.get("Content-Type") || "application/octet-stream");
    headers.set("Content-Disposition", `attachment; filename="${filePath.split("/").pop()}"`);

    return new NextResponse(fileRes.body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memproses unduhan" },
      { status: 500 }
    );
  }
}
