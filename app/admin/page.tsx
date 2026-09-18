"use client";

import { useState } from "react";

export default function AdminPage() {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    type: "online",
    price: "",
    description: "",
    durationDays: "30",
    appUrl: "",
    token: "",
  });
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Memproses...");

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${formData.token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          durationDays: Number(formData.durationDays),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("Berhasil menambahkan produk!");
      } else {
        setStatus(`Gagal: ${data.error}`);
      }
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: "30px", maxWidth: "600px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>Dashboard Admin - Input Produk</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input
          type="text"
          placeholder="Firebase Admin Auth Token"
          value={formData.token}
          onChange={(e) => setFormData({ ...formData, token: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Product ID (contoh: APP001)"
          value={formData.id}
          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Nama Produk"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        >
          <option value="online">Online (SaaS / Web App)</option>
          <option value="download">Download (File Storage)</option>
        </select>
        <input
          type="number"
          placeholder="Harga (IDR)"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          required
        />
        {formData.type === "online" && (
          <>
            <input
              type="number"
              placeholder="Durasi Akses (Hari)"
              value={formData.durationDays}
              onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
            />
            <input
              type="text"
              placeholder="URL Aplikasi (App URL)"
              value={formData.appUrl}
              onChange={(e) => setFormData({ ...formData, appUrl: e.target.value })}
            />
          </>
        )}
        <textarea
          placeholder="Deskripsi Produk"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <button type="submit" style={{ padding: "10px", background: "#0070f3", color: "#fff", border: "none", cursor: "pointer" }}>
          Simpan Produk
        </button>
      </form>
      {status && <p style={{ marginTop: "15px", fontWeight: "bold" }}>{status}</p>}
    </div>
  );
}
