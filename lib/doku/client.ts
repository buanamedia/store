import crypto from "crypto";

interface DokuCheckoutPayload {
  orderId: string;
  amount: number;
  productName: string;
  customerEmail: string;
  customerName?: string;
}

export async function createDokuInvoice(payload: DokuCheckoutPayload) {
  const clientId = process.env.DOKU_CLIENT_ID;
  const secretKey = process.env.DOKU_SECRET_KEY;
  const dokuEnv = process.env.DOKU_ENV || "sandbox";

  if (!clientId || !secretKey) {
    throw new Error("DOKU Client ID atau Secret Key belum dikonfigurasi di Environment Variables.");
  }

  const baseUrl =
    dokuEnv === "production"
      ? "https://api.doku.com"
      : "https://api-sandbox.doku.com";

  const requestPath = "/checkout/v1/payment";
  const requestId = crypto.randomUUID();
  const requestTimestamp = new Date().toISOString().slice(0, 19) + "Z";

  const body = {
    order: {
      invoice_number: payload.orderId,
      amount: payload.amount,
      line_items: [
        {
          name: payload.productName,
          price: payload.amount,
          quantity: 1,
        },
      ],
    },
    customer: {
      email: payload.customerEmail,
      name: payload.customerName || "Customer",
    },
  };

  const jsonBody = JSON.stringify(body);

  // 1. Generate Digest (SHA256 Hash dari Request Body)
  const digest = crypto
    .createHash("sha256")
    .update(jsonBody)
    .digest("base64");

  // 2. Generate Signature Component
  const signatureRaw = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${requestPath}\nDigest:${digest}`;

  // 3. Generate HMAC-SHA256 Signature
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(signatureRaw)
    .digest("base64");

  const response = await fetch(`${baseUrl}${requestPath}`, {
    method: "POST",
    headers: {
      "Client-Id": clientId,
      "Request-Id": requestId,
      "Request-Timestamp": requestTimestamp,
      "Signature": `HMACSHA256=${signature}`,
      "Content-Type": "application/json",
    },
    body: jsonBody,
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(`DOKU API Error: ${responseData.message || "Gagal membuat invoice"}`);
  }

  return responseData; // Mengembalikan payment_url dari DOKU
}
