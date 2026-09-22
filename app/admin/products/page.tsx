"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ProductsAndTransactionsPage() {
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "transactions">("products");

  // Data Products
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Data Transactions
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load Data Produk
  const loadProducts = async (pwd: string) => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`/api/admin/products?password=${encodeURIComponent(pwd)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts(data.products || []);
      } else {
        alert(data.message || "Password Salah!");
        setIsAuthenticated(false);
      }
    } catch (e: any) {
      alert("Error memuat produk: " + e.message);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Load Data Transaksi
  const loadTransactions = async (pwd: string) => {
    setLoadingTransactions(true);
    try {
      const res = await fetch(`/api/admin/transactions?password=${encodeURIComponent(pwd)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setTransactions(data.transactions || []);
      } else {
        alert(data.message || "Gagal memuat daftar transaksi");
      }
    } catch (e: any) {
      alert("Error memuat transaksi: " + e.message);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword.trim().length > 0) {
      setIsAuthenticated(true);
      loadProducts(adminPassword);
      loadTransactions(adminPassword);
    }
  };

  // Copy Snippet Kode Blogspot
  const copyBlogspotSnippet = (product: any) => {
    const formattedPrice = Number(product.price || 0).toLocaleString("id-ID");
    const waText = encodeURIComponent(`Halo Admin, saya ingin bertanya tentang produk '${product.name}' (${product.id}).`);
    const waLink = `https://wa.me/6281414159500?text=${waText}`;

    const snippet = `<!-- Script Widget STORE Engine -->
<script src="https://undig.buanamedia.my.id/blogspot/widget.js"></script>

<!-- Container 2 Tombol (Presisi Sama Tinggi) -->
<div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin: 16px 0;">
  <button type="button" id="${product.id}" class="se-buy-btn" style="display: inline-flex; align-items: center; justify-content: center; height: 48px; padding: 0 24px; background-color: #2563eb; color: #ffffff; border: none; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer; box-sizing: border-box; font-family: inherit;">
    Beli ${product.name} - Rp ${formattedPrice}
  </button>
  <a href="${waLink}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 48px; padding: 0 24px; background-color: #25D366; color: #ffffff; border: none; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer; text-decoration: none; box-sizing: border-box; font-family: inherit;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
    Hubungi Admin
  </a>
</div>`;

    navigator.clipboard.writeText(snippet);
    setCopiedId(product.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", color: "#f8fafc", padding: "20px 12px", fontFamily: "sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        table { border-collapse: collapse !important; width: 100% !important; }
        td, th { vertical-align: middle !important; white-space: nowrap !important; }
        a { text-decoration: none !important; }
      `}</style>

      {!isAuthenticated ? (
        /* Form Login Admin */
        <div style={{ maxWidth: "400px", width: "100%", margin: "60px auto 0 auto", background: "#1e293b", padding: "24px", borderRadius: "16px", border: "1px solid #334155", textAlign: "center" }}>
          <h2 style={{ color: "#38bdf8", marginTop: 0 }}>Kelola Produk & Transaksi</h2>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "24px" }}>Masukkan Password Admin Vercel Anda.</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              required
              placeholder="Password Admin"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box", marginBottom: "16px", fontSize: "1rem" }}
            />
            <button
              type="submit"
              style={{ width: "100%", padding: "12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "1rem", cursor: "pointer" }}
            >
              Masuk
            </button>
          </form>
        </div>
      ) : (
        /* Main Dashboard View */
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", background: "#1e293b", padding: "20px 24px", borderRadius: "12px", border: "1px solid #334155", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h1 style={{ fontSize: "1.3rem", margin: 0, color: "#38bdf8" }}>Manajemen Toko</h1>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Produk & Transaksi STORE Engine</span>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <Link href="/admin" style={{ background: "#334155", color: "#f8fafc", padding: "8px 12px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "bold" }}>
                ⚙️ Dashboard Utama
              </Link>
              <button onClick={() => setIsAuthenticated(false)} style={{ background: "#ef4444", border: "none", color: "#fff", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem" }}>
                Logout
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <button
              onClick={() => setActiveTab("products")}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                fontWeight: "bold",
                fontSize: "0.95rem",
                cursor: "pointer",
                background: activeTab === "products" ? "#2563eb" : "#1e293b",
                color: activeTab === "products" ? "#ffffff" : "#94a3b8",
              }}
            >
              📦 Daftar Produk ({products.length})
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                fontWeight: "bold",
                fontSize: "0.95rem",
                cursor: "pointer",
                background: activeTab === "transactions" ? "#2563eb" : "#1e293b",
                color: activeTab === "transactions" ? "#ffffff" : "#94a3b8",
              }}
            >
              💳 Daftar Transaksi ({transactions.length})
            </button>
          </div>

          {/* TAB 1: DAFTAR PRODUK */}
          {activeTab === "products" && (
            <div style={{ background: "#1e293b", padding: "24px", borderRadius: "16px", border: "1px solid #334155" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "1.1rem", margin: 0, color: "#f8fafc" }}>Semua Produk Tersimpan</h2>
                <button onClick={() => loadProducts(adminPassword)} style={{ background: "#334155", border: "none", color: "#38bdf8", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>Refresh Produk</button>
              </div>

              {loadingProducts ? (
                <p style={{ color: "#94a3b8" }}>Memuat daftar produk...</p>
              ) : products.length === 0 ? (
                <p style={{ color: "#94a3b8" }}>Belum ada produk yang tersimpan.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", textAlign: "left", fontSize: "0.85rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8" }}>
                        <th style={{ padding: "12px 10px" }}>ID Produk</th>
                        <th style={{ padding: "12px 10px" }}>Nama Produk</th>
                        <th style={{ padding: "12px 10px" }}>Harga</th>
                        <th style={{ padding: "12px 10px" }}>Tipe</th>
                        <th style={{ padding: "12px 10px" }}>Lisensi Mode</th>
                        <th style={{ padding: "12px 10px", textAlign: "right" }}>Kode Blogspot</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id} style={{ borderBottom: "1px solid #334155" }}>
                          <td style={{ padding: "12px 10px", fontWeight: "bold", color: "#38bdf8" }}>{p.id}</td>
                          <td style={{ padding: "12px 10px" }}>{p.name}</td>
                          <td style={{ padding: "12px 10px", color: "#10b981", fontWeight: "bold" }}>Rp {Number(p.price || 0).toLocaleString("id-ID")}</td>
                          <td style={{ padding: "12px 10px" }}>
                            <span style={{ padding: "4px 8px", borderRadius: "4px", background: p.type === "ACCESS" ? "#065f46" : "#1e40af", color: "#fff", fontSize: "0.75rem", fontWeight: "600" }}>
                              {p.type || "DOWNLOAD"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 10px", color: "#cbd5e1" }}>
                            {p.hasLicense === false ? "Tanpa Lisensi" : p.licenseMode || "AUTO"}
                          </td>
                          <td style={{ padding: "12px 10px", textAlign: "right" }}>
                            <button
                              onClick={() => copyBlogspotSnippet(p)}
                              style={{
                                background: copiedId === p.id ? "#10b981" : "#2563eb",
                                color: "#fff",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                fontWeight: "bold"
                              }}
                            >
                              {copiedId === p.id ? "✓ Tersalin!" : "📋 Copy Code"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DAFTAR TRANSAKSI */}
          {activeTab === "transactions" && (
            <div style={{ background: "#1e293b", padding: "24px", borderRadius: "16px", border: "1px solid #334155" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "1.1rem", margin: 0, color: "#f8fafc" }}>Riwayat Pembayaran & Transaksi</h2>
                <button onClick={() => loadTransactions(adminPassword)} style={{ background: "#334155", border: "none", color: "#38bdf8", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>Refresh Transaksi</button>
              </div>

              {loadingTransactions ? (
                <p style={{ color: "#94a3b8" }}>Memuat riwayat transaksi...</p>
              ) : transactions.length === 0 ? (
                <p style={{ color: "#94a3b8" }}>Belum ada riwayat transaksi ditemukan.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", textAlign: "left", fontSize: "0.85rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8" }}>
                        <th style={{ padding: "12px 10px" }}>ID Transaksi / Ref</th>
                        <th style={{ padding: "12px 10px" }}>Pelanggan</th>
                        <th style={{ padding: "12px 10px" }}>Produk</th>
                        <th style={{ padding: "12px 10px" }}>Total Nominal</th>
                        <th style={{ padding: "12px 10px" }}>Status</th>
                        <th style={{ padding: "12px 10px" }}>Tanggal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id || tx.reference} style={{ borderBottom: "1px solid #334155" }}>
                          <td style={{ padding: "12px 10px", fontFamily: "monospace", color: "#38bdf8" }}>{tx.reference || tx.id}</td>
                          <td style={{ padding: "12px 10px" }}>
                            <div><strong>{tx.customerName || "-"}</strong></div>
                            <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{tx.customerEmail || "-"}</div>
                          </td>
                          <td style={{ padding: "12px 10px" }}>{tx.productName || tx.productId}</td>
                          <td style={{ padding: "12px 10px", color: "#10b981", fontWeight: "bold" }}>
                            Rp {Number(tx.amount || tx.price || 0).toLocaleString("id-ID")}
                          </td>
                          <td style={{ padding: "12px 10px" }}>
                            <span style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                              background: tx.status === "PAID" || tx.status === "SUCCESS" ? "#065f46" : tx.status === "UNPAID" || tx.status === "PENDING" ? "#9a3412" : "#334155",
                              color: "#fff"
                            }}>
                              {tx.status || "PENDING"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 10px", color: "#cbd5e1", fontSize: "0.8rem" }}>
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleString("id-ID") : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
