import { NextResponse } from "next/server";
import type { NextRequest } from "next/request";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  // 1. Proteksi Halaman Admin Panel
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const authHeader = req.headers.get("authorization");
    const adminSessionCookie = req.cookies.get("store_admin_session");

    // Jika tidak ada header auth atau cookie session admin, redirect ke login admin
    if (!authHeader && !adminSessionCookie) {
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // 2. Proteksi Endpoint API Admin
  if (pathname.startsWith("/api/admin")) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "UNAUTHORIZED: Token autentikasi diperlukan." },
        { status: 401 }
      );
    }
  }

  // 3. Konfigurasi Header Keamanan Tambahan
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
