"use client";

import React, { useState } from "react";
import { ProductType, ProductStatus } from "@/types/product";

export default function AdminProductsPage() {
  const [formData, setFormData] = useState({
    id: "APP001",
    name: "Software Absensi Online",
    type: "online" as ProductType,
    price: 50000,
    description: "Sistem absensi pegawai berbasis web.",
    version: "1.0",
    imageUrl: "",
    status: "active" as ProductStatus,
    durationDays: 30,
    appUrl: "https://app.example.com",
    telegramFileId: "",
    telegramMessageId: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-sm rounded-xl border my-8">
      <h1 className="text-xl font-bold mb-6 text-gray-800">Admin STORE — Tambah / Edit Produk</h1>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Product ID</label>
            <input type="text" name="id" value={formData.id} onChange={handleChange} className="w-full border p-2 rounded text-sm" placeholder="Contoh: APP001 / SW001" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Produk</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border p-2 rounded text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Jenis Produk</label>
            <select name="type" value={formData.type} onChange={handleChange} className="w-full border p-2 rounded text-sm bg-white">
              <option value="online">Online Software</option>
              <option value="download">Download Software</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Harga (Rp)</label>
            <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full border p-2 rounded text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full border p-2 rounded text-sm bg-white">
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </div>

        {formData.type === "online" ? (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-3">
            <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide">Konfigurasi Software Online</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">URL Aplikasi Online</label>
                <input type="text" name="appUrl" value={formData.appUrl} onChange={handleChange} className="w-full border p-2 rounded text-sm bg-white" placeholder="https://app.example.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Durasi Akses (Hari)</label>
                <input type="number" name="durationDays" value={formData.durationDays} onChange={handleChange} className="w-full border p-2 rounded text-sm bg-white" />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg space-y-3">
            <h3 className="text-xs font-bold text-purple-800 uppercase tracking-wide">Konfigurasi Software Download (Telegram)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Telegram File ID</label>
                <input type="text" name="telegramFileId" value={formData.telegramFileId} onChange={handleChange} className="w-full border p-2 rounded text-sm bg-white" placeholder="Contoh: BQACAgUAAx..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Telegram Message ID</label>
                <input type="text" name="telegramMessageId" value={formData.telegramMessageId} onChange={handleChange} className="w-full border p-2 rounded text-sm bg-white" placeholder="Contoh: 104" />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Deskripsi Produk</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full border p-2 rounded text-sm"></textarea>
        </div>

        <button type="button" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium p-2.5 rounded-lg text-sm transition">
          Simpan Produk
        </button>
      </form>
    </div>
  );
}
