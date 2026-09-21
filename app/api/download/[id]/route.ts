import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params?.id;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!fileId || !botToken) {
      return NextResponse.json(
        { success: false, message: "Konfigurasi file atau token tidak valid" },
        { status: 400 }
      );
    }

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

    const fileRes = await fetch(downloadUrl);

    if (!fileRes.ok) {
      return NextResponse.json(
        { success: false, message: "Gagal mengunduh file dari storage" },
        { status: 500 }
      );
    }

    const headers = new Headers();
    headers.set("Content-Type", fileRes.headers.get("Content-Type") || "application/octet-stream");
    headers.set("Content-Disposition", `attachment; filename="${filePath.split("/").pop()}"`);

    return new NextResponse(fileRes.body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Download API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memproses unduhan" },
      { status: 500 }
    );
  }
}
