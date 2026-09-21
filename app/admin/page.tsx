"use client";

import React, { useState } from "react";

export const dynamic = "force-dynamic";

// URL Web App Google Apps Script Anda
const GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbx23eHNYQIgdnkZckezSsKvvmOaLqBYreIJRiQJbVZEN_71h6cRZO8LUrEskl2riK_G/exec";

export default function AdminDashboardPage() {
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Data Products dari Database
  const [products, setProducts] = useState<any[]>([]);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State untuk Tambah / Update Produk
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("DOWNLOAD");
  const [hasLicense, setHasLicense] = useState(true);
  const [licenseMode, setLicenseMode] = useState("AUTO");
  const [manualKeys, setManualKeys] = useState("");
  const [generatorApiUrl, setGeneratorApiUrl] = useState("");
  const [appUrl, setAppUrl] = useState("");

  // Modus Input File: "UPLOAD" (Direct GAS) atau "MANUAL_ID" (File Telegram Besar)
  const [uploadMode, setUploadMode] = useState<"UPLOAD" | "MANUAL_ID">("UPLOAD");
  const [file, setFile] = useState<File | null>(null);
  const [manualTelegramFileId, setManualTelegramFileId] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadProducts = async (pwd: string) => {
    setFetchingProducts(true);
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
      setFetchingProducts(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword.trim().length > 0) {
      setIsAuthenticated(true);
      loadProducts(adminPassword);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Copy Snippet Kode Blogspot
  const copyBlogspotSnippet = (product: any) => {
    const formattedPrice = Number(product.price || 0).toLocaleString("id-ID");
    const snippet = `<!-- Script Widget STORE Engine -->
<script src="https://undig.buanamedia.my.id/blogspot/widget.js"></script>

<!-- Tombol Checkout (${product.name}) -->
<button type="button" id="${product.id}" class="se-buy-btn" style="padding: 14px 28px; background-color: #2563eb; color: #ffffff; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer;">
  Beli ${product.name} - Rp ${formattedPrice}
</button>`;

    navigator.clipboard.writeText(snippet);
    setCopiedId(product.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  // Fungsi Hapus Produk dari Firestore & Telegram
  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk '${productName}' (${productId}) dari database & Telegram?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(productId)}&password=${encodeURIComponent(adminPassword)}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert(`Produk '${productId}' berhasil dihapus!`);
        loadProducts(adminPassword);
      } else {
        alert(`Gagal menghapus: ${data.message}`);
      }
    } catch (err: any) {
      alert("Error saat menghapus produk: " + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let finalTelegramFileId = "";

      if (type === "DOWNLOAD") {
        if (uploadMode === "UPLOAD" && file) {
          setLoadingStatus("Mengunggah file ke Telegram via GAS...");
          const base64Data = await fileToBase64(file);

          const gasRes = await fetch(GAS_WEBAPP_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({
              secretKey: "gpfadmin123",
              fileName: file.name,
              category: "ZIP",
              fileData: base64Data,
            }),
          });

          const gasData = await gasRes.json();

          if (!gasData || !gasData.success) {
            throw new Error("Gagal Unggah ke Telegram (GAS): " + (gasData?.message || "Error Tidak Diketahui"));
          }

          finalTelegramFileId = gasData.telegramFileId;
        } else if (uploadMode === "MANUAL_ID") {
          finalTelegramFileId = manualTelegramFileId.trim();
        }
      }

      const cleanPriceInput = Math.round(parseFloat(price.toString().replace(/[^0-9.]/g, "")) || 0);

      setLoadingStatus("Menyimpan konfigurasi produk ke Firestore...");
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminPassword,
          id: id.trim().toLowerCase().replace(/\s+/g, "-"),
          name,
          price: cleanPriceInput,
          type,
          hasLicense,
          licenseMode,
          manualKeys,
          generatorApiUrl,
          appUrl,
          telegramFileId: finalTelegramFileId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({
          type: "success",
          text: `Berhasil! Produk '${id}' tersimpan & siap digunakan. File ID: ${finalTelegramFileId || "N/A"}`
        });
        setId("");
        setName("");
        setPrice("");
        setAppUrl("");
        setManualKeys("");
        setGeneratorApiUrl("");
        setManualTelegramFileId("");
        setFile(null);
        loadProducts(adminPassword);
      } else {
        setMessage({ type: "error", text: data.message || "Gagal menyimpan produk." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Terjadi kesalahan: " + err.message });
    } finally {
      setLoading(false);
      setLoadingStatus("");
    }
  };

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", color: "#f8fafc", padding: "40px 20px", fontFamily: "sans-serif" }}>
      {/* PENAMBAHAN FIX CSS AGAR TAMPILAN PREISI */}
      <style>{`
        * { box-sizing: border-box; }
        table { border-collapse: collapse !important; width: 100% !important; }
        td, th { vertical-align: middle !important; white-space: nowrap !important; }
        button { display: inline-flex !important; align-items: center !important; justify-content: center !important; height: auto !important; min-height: 32px !important; }
      `}</style>

      {!isAuthenticated ? (
        /* Layar Login Admin */
        <div style={{ maxWidth: "400px", width: "100%", margin: "80px auto 0 auto", background: "#1e293b", padding: "32px", borderRadius: "16px", border: "1px solid #334155", textAlign: "center" }}>
          <h2 style={{ color: "#38bdf8", marginTop: 0 }}>STORE Admin Login</h2>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "24px" }}>Masukkan Password Admin Vercel Anda untuk melanjutkan.</p>
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
              Masuk Dashboard
            </button>
          </form>
        </div>
      ) : (
        /* Dashboard Admin Main View */
        <div style={{ maxWidth: "1050px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", background: "#1e293b", padding: "20px 24px", borderRadius: "12px", border: "1px solid #334155" }}>
            <div>
              <h1 style={{ fontSize: "1.4rem", margin: 0, color: "#38bdf8" }}>STORE Engine Dashboard</h1>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>buanamedia.my.id</span>
            </div>
            <button onClick={() => setIsAuthenticated(false)} style={{ background: "#ef4444", border: "none", color: "#fff", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem" }}>Logout</button>
          </div>

          {/* TABEL DAFTAR PRODUK */}
          <div style={{ background: "#1e293b", padding: "24px", borderRadius: "16px", border: "1px solid #334155", marginBottom: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1.1rem", margin: 0, color: "#f8fafc" }}>Daftar Produk di Database ({products.length})</h2>
              <button onClick={() => loadProducts(adminPassword)} style={{ background: "#334155", border: "none", color: "#38bdf8", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>Refresh Data</button>
            </div>

            {fetchingProducts ? (
              <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Memuat produk dari Firestore...</p>
            ) : products.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Belum ada produk yang tersimpan.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8" }}>
                      <th style={{ padding: "12px 10px" }}>ID Produk</th>
                      <th style={{ padding: "12px 10px" }}>Nama Produk</th>
                      <th style={{ padding: "12px 10px" }}>Harga</th>
                      <th style={{ padding: "12px 10px" }}>Tipe</th>
                      <th style={{ padding: "12px 10px" }}>Lisensi Mode</th>
                      <th style={{ padding: "12px 10px" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid #0f172a" }}>
                        <td style={{ padding: "12px 10px", fontWeight: "bold", color: "#38bdf8" }}>{p.id}</td>
                        <td style={{ padding: "12px 10px" }}>{p.name}</td>
                        <td style={{ padding: "12px 10px", color: "#10b981", fontWeight: "bold" }}>Rp {Number(p.price || 0).toLocaleString("id-ID")}</td>
                        <td style={{ padding: "12px 10px" }}>
                          <span style={{ padding: "4px 8px", borderRadius: "4px", background: p.type === "ACCESS" ? "#065f46" : "#1e40af", color: "#fff", fontSize: "0.75rem" }}>
                            {p.type || "DOWNLOAD"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 10px", color: "#cbd5e1" }}>
                          {p.hasLicense === false ? "Tanpa Lisensi" : p.licenseMode || "AUTO"}
                        </td>
                        <td style={{ padding: "12px 10px" }}>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <button
                              type="button"
                              onClick={() => copyBlogspotSnippet(p)}
                              style={{
                                background: copiedId === p.id ? "#10b981" : "#2563eb",
                                color: "#fff",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                fontWeight: "bold",
                              }}
                            >
                              {copiedId === p.id ? "✓ Tersalin!" : "📋 Copy Code"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              style={{
                                background: "#ef4444",
                                color: "#fff",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                fontWeight: "bold",
                              }}
                            >
                              🗑 Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* FORM TAMBAH / UPDATE PRODUK */}
          <div style={{ background: "#1e293b", padding: "28px", borderRadius: "16px", border: "1px solid #334155" }}>
            <h2 style={{ fontSize: "1.1rem", margin: "0 0 16px 0", color: "#f8fafc" }}>Tambah / Update Produk Baru</h2>

            {message && (
              <div style={{
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "0.9rem",
                background: message.type === "success" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                border: `1px solid ${message.type === "success" ? "#10b981" : "#ef4444"}`,
                color: message.type === "success" ? "#34d399" : "#fca5a5"
              }}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>ID Produk (Slug Unik)</label>
                <input
                  type="text"
                  required
                  placeholder="contoh: clipprovit-pro atau saas-tool"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>Nama Produk</label>
                <input
                  type="text"
                  required
                  placeholder="contoh: ClipProvit Software License"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>Harga Produk (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="10000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>Tipe Penjualan</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }}
                >
                  <option value="DOWNLOAD">File Download / Software Installer</option>
                  <option value="ACCESS">Akses Portal Web / Aplikasi / SaaS</option>
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "#e2e8f0" }}>
                  <input
                    type="checkbox"
                    checked={hasLicense}
                    onChange={(e) => setHasLicense(e.target.checked)}
                    style={{ width: "18px", height: "18px" }}
                  />
                  Gunakan Kode Lisensi Unik?
                </label>
              </div>

              {hasLicense && (
                <div style={{ background: "#0f172a", padding: "16px", borderRadius: "8px", border: "1px solid #334155", marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#38bdf8", marginBottom: "8px", fontWeight: "bold" }}>Metode Sumber Lisensi Serial Key:</label>
                  <select
                    value={licenseMode}
                    onChange={(e) => setLicenseMode(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #475569", background: "#1e293b", color: "#fff", boxSizing: "border-box", marginBottom: "12px" }}
                  >
                    <option value="AUTO">1. Generate Otomatis (Default STORE Engine)</option>
                    <option value="MANUAL">2. Input Manual Serial Key (Stok Lisensi Saya)</option>
                    <option value="GENERATOR">3. External Keygen API (Hubungkan URL Generator)</option>
                  </select>

                  {licenseMode === "MANUAL" && (
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>Daftar Serial Key (Pisahkan dengan baris baru / koma):</label>
                      <textarea
                        rows={4}
                        placeholder={"CLIP-KEY-111\nCLIP-KEY-222\nCLIP-KEY-333"}
                        value={manualKeys}
                        onChange={(e) => setManualKeys(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #475569", background: "#1e293b", color: "#fff", boxSizing: "border-box", fontFamily: "monospace" }}
                      />
                    </div>
                  )}

                  {licenseMode === "GENERATOR" && (
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>URL External Keygen Generator API:</label>
                      <input
                        type="url"
                        placeholder="https://api.keygen-anda.com/generate"
                        value={generatorApiUrl}
                        onChange={(e) => setGeneratorApiUrl(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #475569", background: "#1e293b", color: "#fff", boxSizing: "border-box" }}
                      />
                    </div>
                  )}
                </div>
              )}

              {type === "ACCESS" ? (
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>URL Portal Web / Aplikasi (`appUrl`)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://app.buanamedia.my.id"
                    value={appUrl}
                    onChange={(e) => setAppUrl(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }}
                  />
                </div>
              ) : (
                <div style={{ marginBottom: "20px", background: "#0f172a", padding: "16px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#38bdf8", marginBottom: "10px", fontWeight: "bold" }}>Metode Pemasokan File Produk:</label>

                  <div style={{ display: "flex", gap: "16px", marginBottom: "12px" }}>
                    <label style={{ cursor: "pointer", fontSize: "0.85rem" }}>
                      <input
                        type="radio"
                        name="uploadMode"
                        checked={uploadMode === "UPLOAD"}
                        onChange={() => setUploadMode("UPLOAD")}
                        style={{ marginRight: "6px" }}
                      />
                      1. Unggah Langsung File Baru (via GAS)
                    </label>
                    <label style={{ cursor: "pointer", fontSize: "0.85rem" }}>
                      <input
                        type="radio"
                        name="uploadMode"
                        checked={uploadMode === "MANUAL_ID"}
                        onChange={() => setUploadMode("MANUAL_ID")}
                        style={{ marginRight: "6px" }}
                      />
                      2. Input Manual Telegram File ID (File Besar)
                    </label>
                  </div>

                  {uploadMode === "UPLOAD" ? (
                    <div>
                      <input
                        type="file"
                        required={uploadMode === "UPLOAD"}
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #475569", background: "#1e293b", color: "#fff", boxSizing: "border-box" }}
                      />
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        required={uploadMode === "MANUAL_ID"}
                        placeholder="Tempel file_id Telegram di sini (contoh: BQACAg...)"
                        value={manualTelegramFileId}
                        onChange={(e) => setManualTelegramFileId(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #475569", background: "#1e293b", color: "#fff", boxSizing: "border-box", fontFamily: "monospace" }}
                      />
                      {/* PANDUAN PENGAMBILAN TELEGRAM FILE ID */}
                      <div style={{ background: "#1e293b", border: "1px solid #334155", padding: "10px 12px", borderRadius: "6px", marginTop: "8px", fontSize: "0.75rem", color: "#94a3b8" }}>
                        <strong style={{ color: "#38bdf8" }}>Cara Ambil Telegram File ID (File Besar):</strong>
                        <ol style={{ margin: "4px 0 0 0", paddingLeft: "16px", lineHeight: "1.5" }}>
                          <li>Kirim file aplikasi berukuran besar langsung ke Bot Telegram Anda.</li>
                          <li>Buka browser dan akses: <code style={{ color: "#f1f5f9" }}>https://api.telegram.org/bot8866448027:AAGnI1f00nwAk0LF9Ge5mYlXVi_mJQoVnk8/getUpdates</code></li>
                          <li>Cari teks <code style={{ color: "#f1f5f9" }}>"file_id"</code> pada objek dokumen, lalu salin kodenya dan tempelkan di kolom atas.</li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (loadingStatus || "Memproses...") : "Simpan Produk Ke Database"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
