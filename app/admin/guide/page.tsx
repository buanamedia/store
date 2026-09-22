"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminGuidePage() {
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Auto Login via sessionStorage saat halaman dimuat
  useEffect(() => {
    const savedPwd = sessionStorage.getItem("admin_session_pwd");
    if (savedPwd) {
      setAdminPassword(savedPwd);
      verifyPassword(savedPwd);
    }
  }, []);

  const verifyPassword = async (pwd: string) => {
    try {
      const res = await fetch(`/api/admin/products?password=${encodeURIComponent(pwd)}`);
      if (res.ok) {
        setIsAuthenticated(true);
        sessionStorage.setItem("admin_session_pwd", pwd);
      } else {
        alert("Password Admin Salah!");
        sessionStorage.removeItem("admin_session_pwd");
        setIsAuthenticated(false);
      }
    } catch (e: any) {
      alert("Gagal memverifikasi password: " + e.message);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword.trim().length > 0) {
      verifyPassword(adminPassword);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_session_pwd");
    setIsAuthenticated(false);
    setAdminPassword("");
  };

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", color: "#f8fafc", padding: "20px 12px", fontFamily: "sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        a { text-decoration: none !important; }
        code { background: #0f172a; padding: 2px 6px; border-radius: 4px; color: #38bdf8; font-family: monospace; }
        pre { background: #0f172a; padding: 12px; border-radius: 8px; overflow-x: auto; color: #f8fafc; font-size: 0.85rem; border: 1px solid #334155; }
      `}</style>

      {!isAuthenticated ? (
        /* Form Login Admin */
        <div style={{ maxWidth: "400px", width: "100%", margin: "60px auto 0 auto", background: "#1e293b", padding: "24px", borderRadius: "16px", border: "1px solid #334155", textAlign: "center" }}>
          <h2 style={{ color: "#38bdf8", marginTop: 0 }}>Panduan Admin STORE</h2>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "24px" }}>Masukkan Password Admin Vercel Anda.</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              required
              placeholder="Password Admin"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", marginBottom: "16px", fontSize: "1rem" }}
            />
            <button type="submit" style={{ width: "100%", padding: "12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "1rem", cursor: "pointer" }}>
              Buka Panduan
            </button>
          </form>
        </div>
      ) : (
        /* Konten Halaman Panduan */
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {/* Header Navigasi */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", background: "#1e293b", padding: "20px 24px", borderRadius: "12px", border: "1px solid #334155", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h1 style={{ fontSize: "1.3rem", margin: 0, color: "#38bdf8" }}>📖 Panduan Operasional</h1>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>STORE Engine Integration Guide</span>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <Link href="/admin" style={{ background: "#334155", color: "#f8fafc", padding: "8px 12px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "bold" }}>
                ⚙️ Dashboard Utama
              </Link>
              <Link href="/admin/products" style={{ background: "#10b981", color: "#fff", padding: "8px 12px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "bold" }}>
                📦 Produk & Transaksi
              </Link>
              <button onClick={handleLogout} style={{ background: "#ef4444", border: "none", color: "#fff", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem" }}>
                Logout
              </button>
            </div>
          </div>

          {/* Kartu Panduan */}
          <div style={{ background: "#1e293b", padding: "28px", borderRadius: "16px", border: "1px solid #334155", lineHeight: "1.6" }}>
            <h2 style={{ color: "#38bdf8", marginTop: 0, fontSize: "1.1rem" }}>1. Memasang Widget di Blogspot / Web</h2>
            <p style={{ fontSize: "0.9rem", color: "#cbd5e1" }}>
              Untuk memasang tombol beli dan tombol WhatsApp otomatis di postingan Blogspot, gunakan tombol <code>📋 Copy Code</code> yang ada di Dashboard Produk.
            </p>
            <pre>
{`<!-- Script Widget STORE Engine -->
<script src="https://undig.buanamedia.my.id/blogspot/widget.js"></script>

<!-- Container 2 Tombol -->
<div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
  <button type="button" id="ID_PRODUK_ANDA" class="se-buy-btn" ...>
    Beli Nama Produk - Rp 10.000
  </button>
  <a href="https://wa.me/6281414159500..." target="_blank" ...>
    Hubungi Admin
  </a>
</div>`}
            </pre>

            <h2 style={{ color: "#38bdf8", marginTop: "24px", fontSize: "1.1rem" }}>2. Tipe Penjualan Produk</h2>
            <ul style={{ fontSize: "0.9rem", color: "#cbd5e1", paddingLeft: "20px" }}>
              <li><strong>DOWNLOAD:</strong> Digunakan untuk file installer software/zip. Berkas akan otomatis terkirim via Telegram / Vercel saat pembeli lunas.</li>
              <li><strong>ACCESS:</strong> Digunakan untuk layanan berbasis Web / SaaS / Portal Aplikasi. Pembeli akan mendapatkan tautan akses aplikasi langsung di email / halaman sukses.</li>
            </ul>

            <h2 style={{ color: "#38bdf8", marginTop: "24px", fontSize: "1.1rem" }}>3. Sumber Serial Key Lisensi</h2>
            <ul style={{ fontSize: "0.9rem", color: "#cbd5e1", paddingLeft: "20px" }}>
              <li><strong>AUTO:</strong> Sistem STORE Engine akan mengenerate serial key unik secara otomatis untuk setiap transaksi.</li>
              <li><strong>MANUAL:</strong> Mengambil stok serial key dari daftar yang Anda masukkan di Admin Dashboard. Jika stok habis, tombol di Blogspot akan otomatis berubah menjadi <code>❌ Stok Habis</code>.</li>
              <li><strong>GENERATOR:</strong> Mengirimkan webhook request ke API Keygen eksternal Anda untuk meminta lisensi baru secara realtime.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
