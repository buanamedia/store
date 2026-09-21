import CryptoJS from "crypto-js";

interface CreatePaymentParams {
  invoiceNumber: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  productName: string;
  callbackUrl: string;
}

export function generateDokuSignature(
  clientId: string,
  requestId: string,
  requestTimestamp: string,
  requestTarget: string,
  digestHex: string,
  secretKey: string
): string {
  const componentToSign =
    `Client-Id:${clientId}\n` +
    `Request-Id:${requestId}\n` +
    `Request-Timestamp:${requestTimestamp}\n` +
    `Request-Target:${requestTarget}\n` +
    `Digest:${digestHex}`;

  const hmac = CryptoJS.HmacSHA256(componentToSign, secretKey);
  const signature = CryptoJS.enc.Base64.stringify(hmac);

  return `HMACSHA256=${signature}`;
}

export function generateDigest(bodyString: string): string {
  const hash = CryptoJS.SHA256(bodyString);
  return CryptoJS.enc.Base64.stringify(hash);
}

export async function createDokuCheckoutUrl(params: CreatePaymentParams) {
  const clientId = process.env.DOKU_CLIENT_ID || "";
  const secretKey = process.env.DOKU_SECRET_KEY || "";
  const isProduction = process.env.DOKU_IS_PRODUCTION === "true";

  const endpoint = isProduction
    ? "https://api.doku.com/checkout/v1/payment"
    : "https://api-sandbox.doku.com/checkout/v1/payment";

  const requestTarget = "/checkout/v1/payment";
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const requestTimestamp = new Date().toISOString().slice(0, 19) + "Z";

  const payload = {
    order: {
      invoice_number: params.invoiceNumber,
      amount: params.amount,
      line_items: [
        {
          name: params.productName,
          price: params.amount,
          quantity: 1,
        },
      ],
      callback_url: params.callbackUrl,
    },
    customer: {
      name: params.customerName,
      email: params.customerEmail,
    },
  };

  const bodyString = JSON.stringify(payload);
  const digestHex = generateDigest(bodyString);
  const signature = generateDokuSignature(
    clientId,
    requestId,
    requestTimestamp,
    requestTarget,
    digestHex,
    secretKey
  );

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Id": clientId,
      "Request-Id": requestId,
      "Request-Timestamp": requestTimestamp,
      "Signature": signature,
    },
    body: bodyString,
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.message || "Gagal membuat transaksi DOKU");
  }

  return responseData;
}
