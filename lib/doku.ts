import crypto from "crypto";

interface DokuCheckoutParams {
  invoiceNumber: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  productName: string;
  callbackUrl: string;
}

export async function createDokuCheckoutUrl(params: DokuCheckoutParams) {
  const clientId = process.env.DOKU_CLIENT_ID || "";
  const secretKey = process.env.DOKU_SECRET_KEY || "";
  const isProduction = process.env.DOKU_IS_PRODUCTION === "true";

  const baseUrl = isProduction
    ? "https://api.doku.com"
    : "https://api-sandbox.doku.com";

  const targetPath = "/checkout/v1/payment";
  
  // Format Request ID & Request Timestamp (UTC ISO String tanpa milidetik)
  const requestId = `REQ-${Date.now()}`;
  const requestTimestamp = new Date().toISOString().slice(0, 19) + "Z";

  const requestBody = {
    order: {
      invoice_number: params.invoiceNumber,
      amount: params.amount,
      callback_url: params.callbackUrl,
      auto_redirect: true,
    },
    payment: {
      payment_due_date: 60, // 60 menit
    },
    customer: {
      name: params.customerName,
      email: params.customerEmail,
    },
    item: [
      {
        name: params.productName,
        price: params.amount,
        quantity: 1,
      },
    ],
  };

  const jsonBody = JSON.stringify(requestBody);

  // Digest SHA256 dari Request Body
  const digest = crypto
    .createHash("sha256")
    .update(jsonBody)
    .digest("base64");

  // Signature Header Components
  const signatureRaw = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${targetPath}\nDigest:${digest}`;

  // Generate HMAC-SHA256 Signature
  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(signatureRaw);
  const signature = `HMACSHA256=${hmac.digest("base64")}`;

  const response = await fetch(`${baseUrl}${targetPath}`, {
    method: "POST",
    headers: {
      "Client-Id": clientId,
      "Request-Id": requestId,
      "Request-Timestamp": requestTimestamp,
      "Signature": signature,
      "Content-Type": "application/json",
    },
    body: jsonBody,
  });

  const responseData = await response.json();

  if (!response.ok) {
    console.error("DOKU API Error Response:", responseData);
    throw new Error(
      responseData.error?.message || responseData.message || "Gagal membuat transaksi di DOKU"
    );
  }

  return responseData;
}
