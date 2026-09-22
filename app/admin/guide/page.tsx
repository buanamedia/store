"use client";

import React from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminGuidePage() {
  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", color: "#f8fafc", padding: "40px 20px", fontFamily: "sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        code { background: #0f172a; color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.85em; border: 1px solid #334155; }
        a { color: #38bdf8; text-decoration: none; }
        a:hover { text-decoration: underline; }
      `}</style>

      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* HEADER & NAVIGASI */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", background: "#1e293b", padding: "20px 24px", borderRadius: "12px", border: "1px solid #334155" }}>
          <div>
            <h1 style={{ fontSize: "1.4rem", margin: 0, color: "#38bdf8" }}>Panduan Lengkap Admin STORE Engine</h1>
            <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Dokumentasi & Petunjuk Penggunaan</span>
          </div>
          <Link href="/admin" style={{ background: "#2563eb", color: "#fff", padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", fontSize: "0.85rem" }}>
            ← Dashboard
          </Link>
        </div>

        {/* CONTENT BOX */}
        <div style={{ background: "#1e293b", padding: "32px", borderRadius: "16px", border: "1px solid #334155", lineHeight: "1.6" }}>
          
          {/* SECTION 1 */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ color: "#38bdf8", fontSize: "1.2rem", borderBottom: "1px solid #334155", paddingBottom: "8px", marginTop: 0 }}>
              1. Manajemen & Pengaturan Produk
            </h2>
            <p style={{ color: "#cbd5e1", fontSize: "0.9rem" }}>
              Di halaman utama admin, Anda dapat menambah atau memperbarui konfigurasi produk digital yang akan dijual melalui widget Blogspot atau portal web.
            </p>
            <ul style={{ color: "#94a3b8", fontSize: "0.875rem", paddingLeft: "20px" }}>
              <li style={{ marginBottom: "8px" }}><strong style={{ color: "#f8fafc" }}>ID Produk (Slug):</strong> Gunakan teks unik tanpa spasi (misal: <code>clipprovit-pro</code>). ID ini yang dipanggil oleh widget tombol beli.</li>
              <li style={{ marginBottom: "8px" }}><strong style={{ color: "#f8fafc" }}>Tipe Penjualan:</strong> Pilih <code>DOWNLOAD</code> untuk file/aplikasi installer, atau <code>ACCESS</code> untuk tautan aplikasi SaaS / Web.</li>
              <li style={{ marginBottom: "8px" }}><strong style={{ color: "#f8fafc" }}>Harga:</strong> Masukkan angka saja tanpa titik/koma (misal: <code>150000</code>).</li>
            </ul>
          </section>

          {/* SECTION 2 */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ color: "#38bdf8", fontSize: "1.2rem", borderBottom: "1px solid #334155", paddingBottom: "8px" }}>
              2. Metode Sumber Lisensi
            </h2>
            <p style={{ color: "#cbd5e1", fontSize: "0.9rem" }}>
              Jika opsi <strong>"Gunakan Kode Lisensi Unik?"</strong> dicentang, sistem menyediakan 3 metode pemasokan serial key:
            </p>
            <ol style={{ color: "#94a3b8", fontSize: "0.875rem", paddingLeft: "20px" }}>
              <li style={{ marginBottom: "8px" }}><strong style={{ color: "#f8fafc" }}>Generate Otomatis (AUTO):</strong> Sistem STORE Engine membuat kode lisensi acak unik secara otomatis setelah transaksi sukses.</li>
              <li style={{ marginBottom: "8px" }}><strong style={{ color: "#f8fafc" }}>Input Manual (MANUAL):</strong> Masukkan stok serial key yang Anda miliki ke kolom teks (pisahkan dengan baris baru). Sistem akan mengambil satu per satu stok key tersebut saat terjadi pembelian.</li>
              <li style={{ marginBottom: "8px" }}><strong style={{ color: "#f8fafc" }}>External Keygen API (GENERATOR):</strong> Menghubungkan URL API Keygen luar untuk menghasilkan kode lisensi secara dinamis real-time.</li>
            </ol>
          </section>

          {/* SECTION 3 */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ color: "#38bdf8", fontSize: "1.2rem", borderBottom: "1px solid #334155", paddingBottom: "8px" }}>
              3. Cara Mengambil Telegram File ID (Untuk File Berukuran Besar)
            </h2>
            <p style={{ color: "#cbd5e1", fontSize: "0.9rem" }}>
              Untuk file aplikasi yang ukurannya melebihi batas unggah langsung Google Apps Script (GAS), gunakan metode <strong>Input Manual Telegram File ID</strong> dengan langkah-langkah berikut:
            </p>
            <ol style={{ color: "#94a3b8", fontSize: "0.875rem", paddingLeft: "20px", lineHeight: "1.8" }}>
              <li>Kirimkan file installer/aplikasi berukuran besar langsung ke Chat / Group Bot Telegram Anda.</li>
              <li>
  Buka browser dan akses:{" "}
  <a
    href="https://api.telegram.org/bot8866448027:AAGnI1f00nwAk0LF9Ge5mYlXVi_mJQoVnk8/getUpdates"
    target="_blank"
    rel="noopener noreferrer"
    style={{ color: "#38bdf8", wordBreak: "break-all" }}
  >
    https://api.telegram.org/bot8866448027:AAGnI1f00nwAk0LF9Ge5mYlXVi_mJQoVnk8/getUpdates
  </a>
</li>
              <li>Cari objek respon JSON terbaru, lalu temukan teks <code>"file_id"</code> di dalam bagian <code>"document"</code>.
                <br />
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Contoh teks: <code>"file_id": "BQACAgUAAxkBAAIB..."</code></span>
              </li>
              <li>Salin nilai string kodenya (misal: <code>BQACAgUAAxkBAAIB...</code>) dan tempelkan ke kolom <strong>Telegram File ID</strong> pada form tambah produk.</li>
            </ol>
          </section>

          {/* SECTION 4 */}
          <section style={{ marginBottom: "16px" }}>
            <h2 style={{ color: "#38bdf8", fontSize: "1.2rem", borderBottom: "1px solid #334155", paddingBottom: "8px" }}>
              4. Memasang Tombol Beli di Blogspot
            </h2>
            <p style={{ color: "#cbd5e1", fontSize: "0.9rem" }}>
              Di daftar produk dashboard admin, klik tombol <strong>📋 Copy Code</strong> pada produk yang diinginkan, lalu tempelkan kode HTML/JavaScript tersebut di postingan atau tata letak (layout) Blogspot Anda.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
