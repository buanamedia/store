"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

// URL Web App Google Apps Script Anda
const GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwifb1OzsmJ6BeexYfLPV1av2LogDJ36Hc6CJCpmYfkhfFv6xKc-1mAin3nlI6WR8w/exec";

// Nilai Default Bawaan Sistem
const DEFAULT_SETTINGS = {
  headerTitle: "Buana Media Store",
  headerIcon: "🛒",
  gridColumns: 4,
  widgetPosition: "BELOW_CAROUSEL",
  footerText: "© Buana Media. All rights reserved.",
  adminWhatsapp: "081414159500",
};

export default function AdminDashboardPage() {
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Data Products dari Database
  const [products, setProducts] = useState<any[]>([]);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State untuk Tambah / Update Produk
  const [isEditing, setIsEditing] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("DOWNLOAD"); // "DOWNLOAD" | "ACCESS" | "GESTUN"
  const [hasLicense, setHasLicense] = useState(true);
  const [licenseMode, setLicenseMode] = useState("AUTO");
  const [manualKeys, setManualKeys] = useState("");
  const [generatorApiUrl, setGeneratorApiUrl] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [blogUrl, setBlogUrl] = useState(""); // FIELD BARU: blogUrl

  // Foto Produk & Carousel
  const [imageUrl, setImageUrl] = useState("");
  const [showInCarousel, setShowInCarousel] = useState(true);

  // Pengaturan Tampilan Toko (Layout Settings) & Nomor WA
  const [headerTitle, setHeaderTitle] = useState(DEFAULT_SETTINGS.headerTitle);
  const [headerIcon, setHeaderIcon] = useState(DEFAULT_SETTINGS.headerIcon);
  const [gridColumns, setGridColumns] = useState(DEFAULT_SETTINGS.gridColumns);
  const [widgetPosition, setWidgetPosition] = useState(DEFAULT_SETTINGS.widgetPosition);
  const [footerText, setFooterText] = useState(DEFAULT_SETTINGS.footerText);
  const [adminWhatsapp, setAdminWhatsapp] = useState(DEFAULT_SETTINGS.adminWhatsapp);
  const [savingSettings, setSavingSettings] = useState(false);

  // Modus Input File
  const [uploadMode, setUploadMode] = useState<"UPLOAD" | "MANUAL_ID">("UPLOAD");
  const [file, setFile] = useState<File | null>(null);
  const [manualTelegramFileId, setManualTelegramFileId] = useState("");
  const [existingTelegramFileId, setExistingTelegramFileId] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const savedPwd = sessionStorage.getItem("admin_session_pwd");

    if (savedPwd) {
      setAdminPassword(savedPwd);
      setIsAuthenticated(true);
      loadProducts(savedPwd);
      loadSettings(savedPwd);
    }
  }, []);

  const loadProducts = async (pwd: string) => {
    setFetchingProducts(true);
    try {
      const res = await fetch(`/api/admin/products?password=${encodeURIComponent(pwd)}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setProducts(data.products || []);
      } else {
        alert(data.message || "Password Salah!");
        sessionStorage.removeItem("admin_session_pwd");
        setIsAuthenticated(false);
      }
    } catch (e: any) {
      alert("Error memuat produk: " + e.message);
    } finally {
      setFetchingProducts(false);
    }
  };

  const loadSettings = async (pwd: string) => {
    try {
      const res = await fetch(`/api/admin/settings?password=${encodeURIComponent(pwd)}`);
      const data = await res.json();
      if (res.ok && data.settings) {
        setHeaderTitle(data.settings.headerTitle || DEFAULT_SETTINGS.headerTitle);
        setHeaderIcon(data.settings.headerIcon || DEFAULT_SETTINGS.headerIcon);
        setGridColumns(data.settings.gridColumns || DEFAULT_SETTINGS.gridColumns);
        setWidgetPosition(data.settings.widgetPosition || DEFAULT_SETTINGS.widgetPosition);
        setFooterText(data.settings.footerText || DEFAULT_SETTINGS.footerText);
        setAdminWhatsapp(data.settings.adminWhatsapp || DEFAULT_SETTINGS.adminWhatsapp);
      }
    } catch (e: any) {
      console.warn("Gagal memuat pengaturan tampilan:", e.message);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminPassword,
          headerTitle,
          headerIcon,
          gridColumns: Number(gridColumns),
          widgetPosition,
          footerText,
          adminWhatsapp,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert("Pengaturan tampilan toko berhasil disimpan!");
      } else {
        alert("Gagal menyimpan pengaturan: " + data.message);
      }
    } catch (err: any) {
      alert("Error menyimpan pengaturan: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResetSettings = () => {
    if (confirm("Apakah Anda yakin ingin mengembalikan seluruh pengaturan layout ke standar bawaan?")) {
      setHeaderTitle(DEFAULT_SETTINGS.headerTitle);
      setHeaderIcon(DEFAULT_SETTINGS.headerIcon);
      setGridColumns(DEFAULT_SETTINGS.gridColumns);
      setWidgetPosition(DEFAULT_SETTINGS.widgetPosition);
      setFooterText(DEFAULT_SETTINGS.footerText);
      setAdminWhatsapp(DEFAULT_SETTINGS.adminWhatsapp);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (adminPassword.trim().length > 0) {
      sessionStorage.setItem("admin_session_pwd", adminPassword);
      setIsAuthenticated(true);
      loadProducts(adminPassword);
      loadSettings(adminPassword);
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

  const resetForm = () => {
    setIsEditing(false);
    setId("");
    setName("");
    setPrice("");
    setType("DOWNLOAD");
    setHasLicense(true);
    setLicenseMode("AUTO");
    setAppUrl("");
    setBlogUrl("");
    setImageUrl("");
    setShowInCarousel(true);
    setManualKeys("");
    setGeneratorApiUrl("");
    setUploadMode("UPLOAD");
    setManualTelegramFileId("");
    setExistingTelegramFileId("");
    setFile(null);
  };

  const copyBlogspotSnippet = (product: any) => {
    const formattedPrice = Number(product.price || 0).toLocaleString("id-ID");
    const waText = encodeURIComponent(`Halo Admin, saya ingin bertanya tentang produk '${product.name}' (${product.id}).`);
    const cleanWaNumber = adminWhatsapp.replace(/\D/g, "");
    const formattedWa = cleanWaNumber.startsWith("0") ? "62" + cleanWaNumber.slice(1) : cleanWaNumber;
    const waLink = `https://wa.me/${formattedWa}?text=${waText}`;

    const snippet = `<!-- Script Widget STORE Engine -->
<script src="https://undig.buanamedia.my.id/blogspot/widget.js"></script>

<!-- Container 2 Tombol -->
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

  const handleEditPrice = async (product: any) => {
    const inputPrice = prompt(`Masukkan harga baru untuk produk '${product.name}' (Rp):`, product.price);

    if (inputPrice === null) return;

    const newPrice = parseInt(inputPrice.toString().replace(/\D/g, ""), 10);

    if (isNaN(newPrice) || newPrice < 0) {
      alert("Harga tidak valid!");
      return;
    }

    try {
      const keysArray = Array.isArray(product.manualKeys)
        ? product.manualKeys
        : product.manualKeys
        ? String(product.manualKeys).split(/[\n,]+/).map((k) => k.trim()).filter(Boolean)
        : [];

      const payload = {
        adminPassword,
        id: String(product.id || "").trim(),
        name: String(product.name || "").trim(),
        price: newPrice,
        type: product.type || "DOWNLOAD",
        hasLicense: product.hasLicense !== false,
        licenseMode: product.licenseMode || "AUTO",
        manualKeys: keysArray,
        generatorApiUrl: product.generatorApiUrl || "",
        appUrl: product.appUrl || "",
        blogUrl: product.blogUrl || "",
        imageUrl: product.imageUrl || "",
        showInCarousel: product.showInCarousel !== false,
        telegramFileId: product.telegramFileId || "",
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert(`Harga produk '${product.name}' berhasil diubah menjadi Rp ${newPrice.toLocaleString("id-ID")}!`);
        loadProducts(adminPassword);
      } else {
        alert(`Gagal merubah harga: ${data.message}`);
      }
    } catch (err: any) {
      alert("Error saat merubah harga: " + err.message);
    }
  };

  const handleEditFullProduct = (product: any) => {
    setIsEditing(true);
    setId(product.id || "");
    setName(product.name || "");
    setPrice(product.price ? product.price.toString() : "");
    setType(product.type || "DOWNLOAD");
    setHasLicense(product.hasLicense !== false);
    setLicenseMode(product.licenseMode || "AUTO");

    if (Array.isArray(product.manualKeys)) {
      setManualKeys(product.manualKeys.join("\n"));
    } else {
      setManualKeys(product.manualKeys || "");
    }

    setGeneratorApiUrl(product.generatorApiUrl || "");
    setAppUrl(product.appUrl || "");
    setBlogUrl(product.blogUrl || "");
    setImageUrl(product.imageUrl || "");
    setShowInCarousel(product.showInCarousel !== false);

    setExistingTelegramFileId(product.telegramFileId || "");
    if (product.telegramFileId) {
      setUploadMode("MANUAL_ID");
      setManualTelegramFileId(product.telegramFileId);
    } else {
      setUploadMode("UPLOAD");
      setManualTelegramFileId("");
    }

    setFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
      let finalTelegramFileId = manualTelegramFileId.trim();

      if (type === "DOWNLOAD") {
        if (uploadMode === "UPLOAD" && file) {
          setLoadingStatus("Mengunggah file ke Telegram via GAS...");
          const base64Data = await fileToBase64(file);

          const gasRes = await fetch(GAS_WEBAPP_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({
              secretKey: "buanamedia12066911",
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
        } else if (isEditing && !file) {
          finalTelegramFileId = existingTelegramFileId;
        }
      }

      const cleanPriceInput = parseInt(price.toString().replace(/\D/g, ""), 10) || 0;
      const isGestun = type === "GESTUN";

      // Konversi manualKeys String menjadi Array
      const keysArray = manualKeys
        ? manualKeys.split(/[\n,]+/).map((k) => k.trim()).filter(Boolean)
        : [];

      setLoadingStatus("Menyimpan konfigurasi produk ke Firestore...");
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminPassword,
          id: id.trim().toLowerCase().replace(/\s+/g, "-"),
          name: name.trim(),
          price: cleanPriceInput,
          type,
          hasLicense: isGestun ? false : Boolean(hasLicense),
          licenseMode: isGestun ? "AUTO" : licenseMode,
          manualKeys: keysArray,
          generatorApiUrl: generatorApiUrl.trim(),
          appUrl: appUrl.trim(),
          blogUrl: blogUrl.trim(),
          imageUrl: imageUrl.trim(),
          showInCarousel: Boolean(showInCarousel),
          telegramFileId: isGestun ? "" : finalTelegramFileId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({
          type: "success",
          text: `Berhasil! Produk '${id}' tersimpan & siap digunakan.`
        });
        resetForm();
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
    <div style={{ background: "#0f172a", minHeight: "100vh", color: "#f8fafc", padding: "20px 12px", fontFamily: "sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        table { border-collapse: collapse !important; width: 100% !important; }
        td, th { vertical-align: middle !important; white-space: nowrap !important; }
        button { display: inline-flex !important; align-items: center !important; justify-content: center !important; height: auto !important; min-height: 32px !important; }
        a { text-decoration: none !important; }

        @media (max-width: 768px) {
          .dash-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }
          .dash-header-actions {
            width: 100% !important;
            justify-content: space-between !important;
            flex-wrap: wrap !important;
          }
          .dash-card {
            padding: 16px !important;
          }
        }
      `}</style>

      {!isAuthenticated ? (
        <div style={{ maxWidth: "400px", width: "100%", margin: "60px auto 0 auto", background: "#1e293b", padding: "24px", borderRadius: "16px", border: "1px solid #334155", textAlign: "center" }}>
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
        <div style={{ maxWidth: "1050px", margin: "0 auto" }}>
          <div className="dash-header dash-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", background: "#1e293b", padding: "20px 24px", borderRadius: "12px", border: "1px solid #334155" }}>
            <div>
              <h1 style={{ fontSize: "1.3rem", margin: 0, color: "#38bdf8" }}>STORE Engine Dashboard</h1>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>buanamedia.my.id</span>
            </div>
            
            <div className="dash-header-actions" style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <a
                href="https://buanamedia.my.id"
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: "#334155", color: "#f8fafc", padding: "8px 12px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "bold" }}
              >
                🏠 Home
              </a>

              <Link
                href="/admin/gallery"
                style={{ background: "#0284c7", color: "#fff", padding: "8px 12px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "bold" }}
              >
                📁 Cloud Gallery
              </Link>

              <Link
                href="/admin/products"
                style={{ background: "#10b981", color: "#fff", padding: "8px 12px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "bold" }}
              >
                📦 Produk & Transaksi
              </Link>

              <button
                onClick={() => {
                  sessionStorage.removeItem("admin_session_pwd");
                  setIsAuthenticated(false);
                  setAdminPassword("");
                }}
                style={{ background: "#ef4444", border: "none", color: "#fff", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem" }}
              >
                Logout
              </button>
            </div>
          </div>

          {/* FORM PENGATURAN TAMPILAN HALAMAN UTAMA */}
          <div className="dash-card" style={{ background: "#1e293b", padding: "24px", borderRadius: "16px", border: "1px solid #0284c7", marginBottom: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <h2 style={{ fontSize: "1.1rem", color: "#38bdf8", margin: 0 }}>⚙️ Pengaturan Layout & Tampilan Halaman Utama</h2>
              <button
                type="button"
                onClick={handleResetSettings}
                style={{ background: "#475569", color: "#f8fafc", border: "1px solid #64748b", padding: "6px 14px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "bold", cursor: "pointer" }}
              >
                ↺ Reset ke Bawaan
              </button>
            </div>

            <form onSubmit={handleSaveSettings} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>Icon Header</label>
                <input
                  type="text"
                  value={headerIcon}
                  onChange={(e) => setHeaderIcon(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#fff" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>Judul Header</label>
                <input
                  type="text"
                  value={headerTitle}
                  onChange={(e) => setHeaderTitle(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#fff" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>Jumlah Kolom Grid Produk (1 - 5)</label>
                <select
                  value={gridColumns}
                  onChange={(e) => setGridColumns(Number(e.target.value))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#fff" }}
                >
                  <option value={1}>1 Kolom</option>
                  <option value={2}>2 Kolom</option>
                  <option value={3}>3 Kolom</option>
                  <option value={4}>4 Kolom</option>
                  <option value={5}>5 Kolom</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>Posisi Widget Promosi Gestun</label>
                <select
                  value={widgetPosition}
                  onChange={(e) => setWidgetPosition(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#fff" }}
                >
                  <option value="BELOW_CAROUSEL">Di Bawah Carousel</option>
                  <option value="ABOVE_CAROUSEL">Di Atas Carousel</option>
                  <option value="HIDDEN">Sembunyikan Widget</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#38bdf8", marginBottom: "4px", fontWeight: "bold" }}>Nomor WhatsApp Admin</label>
                <input
                  type="text"
                  placeholder="081414159500"
                  value={adminWhatsapp}
                  onChange={(e) => setAdminWhatsapp(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #0284c7", background: "#0f172a", color: "#38bdf8", fontWeight: "bold" }}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>Teks Isi Footer</label>
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#fff" }}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <button
                  type="submit"
                  disabled={savingSettings}
                  style={{ padding: "10px 20px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
                >
                  {savingSettings ? "Menyimpan Pengaturan..." : "Simpan Pengaturan Tampilan"}
                </button>
              </div>
            </form>
          </div>

          {/* FORM TAMBAH / UPDATE PRODUK */}
          <div className="dash-card" style={{ background: "#1e293b", padding: "28px", borderRadius: "16px", border: "1px solid #334155", marginBottom: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1.1rem", margin: 0, color: "#f8fafc" }}>
                {isEditing ? `Edit Produk: ${id}` : "Tambah / Update Produk Baru"}
              </h2>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={{ background: "#475569", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}
                >
                  Batal Edit
                </button>
              )}
            </div>

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
                  readOnly={isEditing}
                  placeholder="contoh: ytcopyright atau saas-tool"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  style={{ 
                    width: "100%", 
                    padding: "10px 12px", 
                    borderRadius: "8px", 
                    border: "1px solid #475569", 
                    background: isEditing ? "#334155" : "#0f172a", 
                    color: isEditing ? "#94a3b8" : "#fff", 
                    boxSizing: "border-box",
                    cursor: isEditing ? "not-allowed" : "text"
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>Nama Produk</label>
                <input
                  type="text"
                  required
                  placeholder="contoh: Yt Copyright Fix"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }}
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
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }}
                />
              </div>

              {/* FOTO PRODUK, BLOGURL & CAROUSEL TOGGLE */}
              <div style={{ background: "#0f172a", padding: "16px", borderRadius: "10px", border: "1px solid #334155", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "0.85rem", color: "#38bdf8", marginTop: 0, marginBottom: "10px" }}>🖼️ Foto Aplikasi, URL Blogspot & Carousel</h3>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>URL Foto Produk / Logo Aplikasi (`imageUrl`)</label>
                  <input
                    type="url"
                    placeholder="https://blogger.googleusercontent.com/img/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #475569", background: "#1e293b", color: "#fff", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>URL Artikel Blogspot Produk (`blogUrl`)</label>
                  <input
                    type="url"
                    placeholder="https://www.buanamedia.my.id/2026/08/YTCopyright.html"
                    value={blogUrl}
                    onChange={(e) => setBlogUrl(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #475569", background: "#1e293b", color: "#fff", boxSizing: "border-box" }}
                  />
                </div>
                <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#e2e8f0", fontSize: "0.85rem" }}>
                  <input
                    type="checkbox"
                    checked={showInCarousel}
                    onChange={(e) => setShowInCarousel(e.target.checked)}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  Tampilkan produk ini di Banner Carousel Halaman Utama?
                </label>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>Tipe Penjualan</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }}
                >
                  <option value="DOWNLOAD">File Download / Software Installer</option>
                  <option value="ACCESS">Akses Portal Web / Aplikasi / SaaS</option>
                  <option value="GESTUN">GESTUN / Tarik Tunai (Layanan Pencairan Dana)</option>
                </select>
              </div>

              {type !== "GESTUN" && (
                <>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#e2e8f0", fontSize: "0.9rem" }}>
                      <input
                        type="checkbox"
                        checked={hasLicense}
                        onChange={(e) => setHasLicense(e.target.checked)}
                        style={{ width: "16px", height: "16px", cursor: "pointer" }}
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
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #475569", background: "#1e293b", color: "#fff", boxSizing: "border-box", marginBottom: licenseMode !== "AUTO" ? "12px" : "0" }}
                      >
                        <option value="AUTO">1. Generate Otomatis (Default STORE Engine)</option>
                        <option value="MANUAL">2. Input Manual Serial Key (Stok Lisensi Saya)</option>
                        <option value="GENERATOR">3. External Keygen API (Hubungkan URL Generator)</option>
                      </select>

                      {licenseMode === "MANUAL" && (
                        <div>
                          <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>Daftar Serial Key (Satu key per baris):</label>
                          <textarea
                            rows={4}
                            placeholder={"YTAF-YGVE-UPY5-BG7V\nYTAF-7F5L-Y8ZV-APNN"}
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
                            style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #475569", background: "#1e293b", color: "#fff", boxSizing: "border-box" }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {type === "ACCESS" && (
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>URL Portal Web / Aplikasi (`appUrl`)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://app.buanamedia.my.id"
                    value={appUrl}
                    onChange={(e) => setAppUrl(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }}
                  />
                </div>
              )}

              {type === "DOWNLOAD" && (
                <div style={{ marginBottom: "20px", background: "#0f172a", padding: "16px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#38bdf8", marginBottom: "12px", fontWeight: "bold" }}>Metode Pemasok File Produk:</label>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
                    <label style={{ cursor: "pointer", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <input
                        type="radio"
                        name="uploadMode"
                        checked={uploadMode === "UPLOAD"}
                        onChange={() => setUploadMode("UPLOAD")}
                        style={{ cursor: "pointer" }}
                      />
                      1. Unggah Langsung File Baru (via GAS)
                    </label>
                    <label style={{ cursor: "pointer", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <input
                        type="radio"
                        name="uploadMode"
                        checked={uploadMode === "MANUAL_ID"}
                        onChange={() => setUploadMode("MANUAL_ID")}
                        style={{ cursor: "pointer" }}
                      />
                      2. Input Manual Telegram File ID (File Besar)
                    </label>
                  </div>

                  {uploadMode === "UPLOAD" ? (
                    <div>
                      <input
                        type="file"
                        required={uploadMode === "UPLOAD" && !isEditing}
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #475569", background: "#1e293b", color: "#fff", boxSizing: "border-box" }}
                      />
                      {isEditing && (
                        <small style={{ color: "#38bdf8", fontSize: "0.75rem", display: "block", marginTop: "4px" }}>
                          Biarkan kosong jika tidak ingin mengganti file eksis.
                        </small>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        required={uploadMode === "MANUAL_ID"}
                        placeholder="Tempel file_id Telegram di sini"
                        value={manualTelegramFileId}
                        onChange={(e) => setManualTelegramFileId(e.target.value)}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #475569", background: "#1e293b", color: "#fff", boxSizing: "border-box", fontFamily: "monospace" }}
                      />
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
                  background: isEditing ? "#0284c7" : "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  transition: "background 0.2s"
                }}
              >
                {loading ? (loadingStatus || "Memproses...") : isEditing ? "Perbarui Produk Di Database" : "Simpan Produk Ke Database"}
              </button>
            </form>
          </div>

          {/* TABEL DAFTAR PRODUK */}
          <div className="dash-card" style={{ background: "#1e293b", padding: "24px", borderRadius: "16px", border: "1px solid #334155" }}>
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
                      <th style={{ padding: "12px 10px" }}>Carousel</th>
                      <th style={{ padding: "12px 10px" }}>Lisensi Mode</th>
                      <th style={{ padding: "12px 10px", textAlign: "right" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid #334155" }}>
                        <td style={{ padding: "12px 10px", fontWeight: "bold", color: "#38bdf8", verticalAlign: "middle" }}>{p.id}</td>
                        <td style={{ padding: "12px 10px", verticalAlign: "middle" }}>{p.name}</td>
                        <td style={{ padding: "12px 10px", color: "#10b981", fontWeight: "bold", verticalAlign: "middle" }}>Rp {Number(p.price || 0).toLocaleString("id-ID")}</td>
                        <td style={{ padding: "12px 10px", verticalAlign: "middle" }}>
                          {p.showInCarousel !== false ? "✅ Tampil" : "❌ Sembunyi"}
                        </td>
                        <td style={{ padding: "12px 10px", color: "#cbd5e1", verticalAlign: "middle" }}>
                          {p.type === "GESTUN" ? "Gestun (Tanpa Lisensi)" : p.hasLicense === false ? "Tanpa Lisensi" : p.licenseMode || "AUTO"}
                        </td>
                        <td style={{ padding: "12px 10px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                            <button
                              onClick={() => handleEditFullProduct(p)}
                              style={{
                                background: "#0284c7",
                                color: "#fff",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                fontWeight: "bold",
                                whiteSpace: "nowrap"
                              }}
                            >
                              ✏️ Edit Lengkap
                            </button>
                            <button
                              onClick={() => handleEditPrice(p)}
                              style={{
                                background: "#f59e0b",
                                color: "#fff",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                fontWeight: "bold",
                                whiteSpace: "nowrap"
                              }}
                            >
                              💰 Edit Harga
                            </button>
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
                                fontWeight: "bold",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {copiedId === p.id ? "✓ Tersalin!" : "📋 Copy Code"}
                            </button>
                            <button
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
                                whiteSpace: "nowrap"
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
        </div>
      )}
    </div>
  );
}
