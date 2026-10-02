import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    console.log("DOKU Webhook Received:", body);

    // DOKU biasanya mengirimkan invoiceNumber di order.invoice_number atau Transaction.InvoiceNumber
    const invoiceNumber = 
      body?.order?.invoice_number || 
      body?.transaction?.invoice_number || 
      body?.order?.id;

    const transactionStatus = 
      body?.transaction?.status || 
      body?.order?.status;

    if (invoiceNumber) {
      // Update status order di Firestore menjadi PAID
      await db.collection("orders").doc(invoiceNumber).update({
        status: "PAID",
        updatedAt: new Date().toISOString(),
      });

      console.log(`Order ${invoiceNumber} successfully marked as PAID via Webhook.`);
    }

    return NextResponse.json({ status: "OK" });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ status: "ERROR", message: error.message }, { status: 500 });
  }
}
