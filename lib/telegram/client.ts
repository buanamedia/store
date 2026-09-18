export interface TelegramFileResponse {
  ok: boolean;
  result?: {
    file_id: string;
    file_unique_id: string;
    file_size?: number;
    file_path?: string;
  };
  description?: string;
}

/**
 * Mengambil metadata lokasi file dari Telegram Bot API
 */
export async function getTelegramFilePath(fileId: string): Promise<string> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN belum dikonfigurasi di Environment Variables.");
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`, {
    method: "GET",
  });

  const data: TelegramFileResponse = await response.json();

  if (!response.ok || !data.ok || !data.result?.file_path) {
    throw new Error(`Telegram API Error: ${data.description || "Gagal mendapatkan lokasi file dari Telegram."}`);
  }

  return data.result.file_path;
}

/**
 * Membuat URL download langsung dari Telegram Server
 */
export async function getTelegramDownloadUrl(fileId: string): Promise<string> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const filePath = await getTelegramFilePath(fileId);

  // Generasi URL sementara dari endpoint file Telegram
  return `https://api.telegram.org/file/bot${botToken}/${filePath}`;
}

/**
 * Mengambil stream file dari Telegram untuk disalurkan (proxy) via backend
 */
export async function fetchTelegramFileStream(fileId: string): Promise<Response> {
  const downloadUrl = await getTelegramDownloadUrl(fileId);
  const response = await fetch(downloadUrl);

  if (!response.ok) {
    throw new Error("Gagal mengambil stream file dari server Telegram.");
  }

  return response;
}
