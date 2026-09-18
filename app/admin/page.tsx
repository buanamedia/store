"use client";

import { useEffect, useState, FormEvent, Suspense } from "react";
import { useRouter } from "next/navigation";

function DashboardContent() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    type: "online",
    price: "",
    description: "",
    durationDays: "30",
    appUrl: "",
    telegramFileId: "",
  });
  const [status, setStatus] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("admin_token");
    if (!savedToken) {
      router.push("/admin/login");
    } else {
      setToken(savedToken);
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    setStatus("Memproses...");

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          durationDays: formData.type === "online" ? Number(formData.durationDays) : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("Berhasil menambahkan produk!");
        setFormData({
          id: "",
          name: "",
          type: "online",
          price: "",
          description: "",
          durationDays: "30",
          appUrl: "",
          telegramFileId: "",
        });
      } else {
        setStatus(`Gagal: ${data.error || "Terjadi kesalahan"}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setStatus(`Error: ${err.message}`);
      } else {
        setStatus("Error: Terjadi kesalahan sistem.");
      }
    }
  };

  if (!token) return null;

  return (
    <div style={{ padding: "30px", maxWidth: "700px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2>Dashboard Admin - Tambah Produk</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px", background: "#f8f9fa", padding: "20px", borderRadius: "8px" }}>
        <input
          type="text"
          placeholder="Product ID (contoh: APP001 / SW001)"
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
        <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
          <option value="online">Online (SaaS / Web App)</option>
          <option value="download">Download (File Storage Telegram)</option>
        </select>
        <input
          type="number"
          placeholder="Harga (IDR)"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          required
        />
        {formData.type === "online" ? (
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
        ) : (
          <input
            type="text"
            placeholder="Telegram File ID"
            value={formData.telegramFileId}
            onChange={(e) => setFormData({ ...formData, telegramFileId: e.target.value })}
          />
        )}
        <textarea
          placeholder="Deskripsi Produk"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <button type="submit" style={{ padding: "12px", background: "#0070f3", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          Simpan Produk
        </button>
      </form>
      {status && <p style={{ marginTop: "15px" }}>{status}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
