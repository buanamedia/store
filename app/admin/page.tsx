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
    } catch (err: any) {
      setStatus(`Error: ${err?.message || "Terjadi kesalahan sistem."}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  if (!token) return null;

  return (
    <div style={{ padding: "30px", maxWidth: "700px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Dashboard Admin</h1>
        <button onClick={handleLogout} style={{ padding: "8px 15px", backgroundColor: "#dc3545", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          Logout
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px", background: "#f8f9fa", padding: "20px", borderRadius: "8px" }}>
        <h3>Tambah Produk Baru</h3>
        
        <input
          type="text"
          placeholder="Product ID (contoh: APP001 / SW001)"
          value={formData.id}
          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
          required
          style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
        />

        <input
          type="text"
          placeholder="Nama Produk"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
        />

        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
        >
          <option value="online">Online (SaaS / Web App)</option>
          <option value="download">Download (File Storage Telegram)</option>
        </select>

        <input
          type="number"
          placeholder="Harga (IDR)"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          required
          style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
        />

        {formData.type === "online" ? (
          <>
            <input
              type="number"
              placeholder="Durasi Akses (Hari)"
              value={formData.durationDays}
              onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
              style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
            <input
              type="text"
              placeholder="URL Aplikasi (App URL)"
              value={formData.appUrl}
              onChange={(e) => setFormData({ ...formData, appUrl: e.target.value })}
              style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </>
        ) : (
          <input
            type="text"
            placeholder="Telegram File ID"
            value={formData.telegramFileId}
            onChange={(e) => setFormData({ ...formData, telegramFileId: e.target.value })}
            style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        )}

        <textarea
          placeholder="Deskripsi Produk"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc", minHeight: "80px" }}
        />

        <button type="submit" style={{ padding: "12px", background: "#0070f3", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
          Simpan Produk
        </button>
      </form>

      {status && <p style={{ marginTop: "15px", fontWeight: "bold" }}>{status}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
