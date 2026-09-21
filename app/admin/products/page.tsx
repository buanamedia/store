"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminProductsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin");
  }, [router]);

  return (
    <div
      style={{
        background: "#0f172a",
        minHeight: "100vh",
        color: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
      }}
    >
      <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
        Mengalihkan ke Dashboard Admin...
      </p>
    </div>
  );
}
