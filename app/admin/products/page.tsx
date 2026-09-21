"use client";

import React, { useState } from "react";

export default function AdminProductsPage() {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("DOWNLOAD");
  const [hasLicense, setHasLicense] = useState(true);
  const [appUrl, setAppUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("id", id.trim().toLowerCase().replace(/\s+/g, "-"));
      formData.append("name", name);
      formData.append("price", price);
      formData.append("type", type);
      formData.append("hasLicense", String(hasLicense));
      if (type === "ACCESS") {
        formData.append("appUrl", appUrl);
      }
      if (type === "DOWNLOAD" && file) {
        formData.append("file", file);
      }

      const res = await fetch("/api/admin/products", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: "success", text: `Berhasil! Produk '${id}' tersimpan. ID File Telegram: ${data.telegramFileId || "N/A"}` });
        // Reset Form
        setId("");
        setName("");
        setPrice("");
        setAppUrl("");
        setFile(null);
      } else {
        setMessage({ type: "error", text: data.message || "Gagal menyimpan produk." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Terjadi kesalahan koneksi: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", color: "#f8fafc", padding: "40px 20px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", background: "#1e293b", padding: "32px", borderRadius: "16px", border: "1px solid #334155" }}>
        <h1 style={{ fontSize: "1.5rem", marginTop: 0, marginBottom: "8px", color: "#38bdf8" }}>STORE Engine - Add Product</h1>
        <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "24px" }}>Input data produk & unggah file otomatis ke Telegram Storage.</p>

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
          {/* ID Produk */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>ID Produk (Slug Unik)</label>
            <input
              type="text"
              required
              placeholder="contoh: clipprovit-license atau saas-tool"
              value={id}
              onChange={(e) => setId(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }}
            />
          </div>

          {/* Nama Produk */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>Nama Produk</label>
            <input
              type="text"
              required
              placeholder="contoh: ClipProvit Pro Software"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }}
            />
          </div>

          {/* Harga Produk */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>Harga Produk (Rp)</label>
            <input
              type="number"
              required
              placeholder="150000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }}
            />
          </div>

          {/* Tipe Penjualan */}
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

          {/* Pengaturan Lisensi */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "#e2e8f0" }}>
              <input
                type="checkbox"
                checked={hasLicense}
                onChange={(e) => setHasLicense(e.target.checked)}
                style={{ width: "18px", height: "18px" }}
              />
              Gunakan Kode Lisensi Unik? (Diperlukan Serial Key)
            </label>
          </div>

          {/* Input Dinamis berdasarkan Tipe */}
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
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>Unggah File Produk (Otomatis ke Telegram Storage)</label>
              <input
                type="file"
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }}
              />
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
            {loading ? "Mengunggah & Menyimpan..." : "Simpan Produk"}
          </button>
        </form>
      </div>
    </div>
  );
}
