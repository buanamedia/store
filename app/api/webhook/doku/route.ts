import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const invoiceNumber = body?.order?.invoice_number;
    const transactionStatus = body?.transaction?.status;

    if (!invoiceNumber) {
      return NextResponse.json({ success: false, message: "Invalid payload" }, { status: 400 });
    }

    const orderRef = db.collection("orders").doc(invoiceNumber);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    if (transactionStatus === "SUCCESS") {
      const orderData = orderDoc.data();

      await orderRef.update({
        status: "PAID",
        updatedAt: new Date().toISOString(),
      });

      const licenseKey = `LIC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      await db.collection("licenses").doc(licenseKey).set({
        licenseKey,
        invoiceNumber,
        productId: orderData?.productId,
        customerEmail: orderData?.customerEmail,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      });
    } else {
      await orderRef.update({
        status: "FAILED",
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (error: any) {
    console.error("Webhook DOKU Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}
