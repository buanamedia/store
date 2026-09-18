import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/security/auth-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const user = await verifyAuthToken(req);
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: "FORBIDDEN: Akses khusus Admin." },
        { status: 403 }
      );
    }

    const adminDb = getAdminDb();
    const [productsSnap, usersSnap, ordersSnap] = await Promise.all([
      adminDb.collection("products").get(),
      adminDb.collection("users").get(),
      adminDb.collection("orders").get(),
    ]);

    const totalProducts = productsSnap.size;
    const totalUsers = usersSnap.size;
    const totalOrders = ordersSnap.size;

    let pendingOrders = 0;
    let paidOrders = 0;
    let totalRevenue = 0;

    const recentOrders: any[] = [];

    ordersSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.status === "PENDING") {
        pendingOrders++;
      } else if (data.status === "PAID") {
        paidOrders++;
        totalRevenue += Number(data.amount || 0);
      }

      recentOrders.push({
        id: doc.id,
        ...data,
      });
    });

    recentOrders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const latestFiveOrders = recentOrders.slice(0, 5);

    return NextResponse.json({
      stats: {
        totalProducts,
        totalUsers,
        totalOrders,
        pendingOrders,
        paidOrders,
        totalRevenue,
      },
      recentOrders: latestFiveOrders,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
