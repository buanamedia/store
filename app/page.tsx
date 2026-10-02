"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings Tampilan Store dari Database
  const [settings, setSettings] = useState<{
    headerTitle: string;
    headerIcon: string;
    gridColumns: number;
    widgetPosition: string;
    footerText: string;
  }>({
    headerTitle: "STORE Engine",
    headerIcon: "🛒",
    gridColumns: 4,
    widgetPosition: "BELOW_CAROUSEL",
    footerText: "© PT Buana Media Bersama. All rights reserved.",
  });

  // Fetch Daftar Produk & Pengaturan Tampilan Toko
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Produk
        const resProd = await fetch("/api/products");
        const dataProd = await resProd.json();
        if (resProd.ok && dataProd.products) {
          const filtered = dataProd.products.filter((p: any) => p.id !== "GESTUN");
          setProducts(filtered);
        }

        // 2. Fetch Pengaturan Tampilan Toko dari Endpoint Public
        const resSet = await fetch("/api/settings");
        const dataSet = await resSet.json();
        if (resSet.ok && dataSet.settings) {
          setSettings({
            headerTitle: dataSet.settings.headerTitle || "STORE Engine",
            headerIcon: dataSet.settings.headerIcon || "🛒",
            gridColumns: Number(dataSet.settings.gridColumns) || 4,
            widgetPosition: dataSet.settings.widgetPosition || "BELOW_CAROUSEL",
            footerText: dataSet.settings.footerText || "© PT Buana Media Bersama. All rights reserved.",
          });
        }
      } catch (err) {
        console.error("Gagal mengambil data toko:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Susun Slide Carousel: Gabungan Gestun + Produk Digital yang Dicentang "showInCarousel !== false"
  const carouselProducts = products.filter((p) => p.showInCarousel !== false);

  const slides = [
    {
      id: "slide-gestun",
      title: "⚡ Layanan Gestun & Tarik Tunai Instant",
      subtitle: "Pencairan dana cepat, biaya transparan 7%, dan diproses otomatis 24/7.",
      badge: "LAYANAN UTAMA",
      ctaText: "Tarik Tunai Sekarang",
      ctaLink: "/gestun",
      imageUrl: "",
      bgGradient: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
    },
    ...carouselProducts.map((p, idx) => ({
      id: p.id,
      title: `🚀 ${p.name}`,
      subtitle: p.description || "Dapatkan akses lisensi resmi instant untuk otomatisasi workflow Anda.",
      badge: `PRODUK DIGITAL ${idx + 1}`,
      ctaText: `Beli ${p.name} - Rp ${Number(p.price || 0).toLocaleString("id-ID")}`,
      ctaLink: `/checkout/${p.id}`,
      imageUrl: p.imageUrl || p.image || p.bannerUrl || "",
      bgGradient:
        idx % 2 === 0
          ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
          : "linear-gradient(135deg, #111827 0%, #374151 100%)",
    })),
  ];

  // Auto Play Banner Carousel
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Elemen Widget Promosi Gestun
  const GestunWidget = (
    <section style={{ marginBottom: "40px" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          border: "1px solid #0284c7",
          borderRadius: "16px",
          padding: "24px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
        }}
      >
        <div style={{ flex: "1 1 300px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{ fontSize: "1.5rem" }}>⚡</span>
            <h3 style={{ fontSize: "1.2rem", color: "#38bdf8", margin: 0 }}>Fitur Gestun & Tarik Tunai Instant</h3>
          </div>
          <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0, lineHeight: "1.6" }}>
            Butuh dana tunai cepat dari QRIS atau Kartu Kredit? Gunakan layanan pencairan otomatis kami dengan potongan transparan dan verifikasi cepat.
          </p>
        </div>

        <Link
          href="/gestun"
          style={{
            padding: "12px 24px",
            background: "#2563eb",
            color: "#ffffff",
            borderRadius: "10px",
            fontWeight: "bold",
            fontSize: "0.9rem",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Mulai Tarik Tunai
        </Link>
      </div>
    </section>
  );

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", color: "#f8fafc", fontFamily: "sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .product-grid {
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)) !important;
          }
        }
      `}</style>

      {/* HEADER / NAVBAR DINAMIS */}
      <header style={{ background: "#1e293b", borderBottom: "1px solid #334155", padding: "16px 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#38bdf8", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>{settings.headerIcon}</span> <span>{settings.headerTitle}</span>
          </Link>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <Link
              href="/gestun"
              style={{
                padding: "8px 16px",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                color: "#fff",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "0.85rem",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
              }}
            >
              ⚡ Layanan Gestun
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 16px 60px" }}>
        
        {/* WIDGET GESTUN (JIKA DIATUR DI ATAS CAROUSEL) */}
        {settings.widgetPosition === "ABOVE_CAROUSEL" && GestunWidget}

        {/* CAROUSEL BANNER HERO RESPONSIVE WITH IMAGE */}
        <section style={{ position: "relative", borderRadius: "20px", overflow: "hidden", marginBottom: "36px", boxShadow: "0 10px 25px rgba(0,0,0,0.4)", border: "1px solid #334155" }}>
          <div
            style={{
              display: "flex",
              transition: "transform 0.5s ease-in-out",
              transform: `translateX(-${currentSlide * 100}%)`,
            }}
          >
            {slides.map((slide) => (
              <div
                key={slide.id}
                style={{
                  minWidth: "100%",
                  background: slide.bgGradient,
                  padding: "40px 32px",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "28px",
                  minHeight: "260px",
                }}
              >
                {slide.imageUrl && (
                  <div style={{ flexShrink: 0, width: "180px", height: "180px", borderRadius: "16px", overflow: "hidden", border: "2px solid rgba(255,255,255,0.15)", boxShadow: "0 8px 20px rgba(0,0,0,0.3)" }}>
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                )}

                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <span style={{ background: "rgba(56, 189, 248, 0.2)", color: "#38bdf8", border: "1px solid #38bdf8", padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "12px" }}>
                    {slide.badge}
                  </span>
                  <h2 style={{ fontSize: "1.7rem", color: "#ffffff", margin: "0 0 10px 0", fontWeight: "800" }}>
                    {slide.title}
                  </h2>
                  <p style={{ fontSize: "0.92rem", color: "#cbd5e1", margin: "0 0 20px 0", maxWidth: "650px", lineHeight: "1.5" }}>
                    {slide.subtitle}
                  </p>
                  <Link
                    href={slide.ctaLink}
                    style={{
                      padding: "12px 24px",
                      background: "#0284c7",
                      color: "#ffffff",
                      borderRadius: "10px",
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                      textDecoration: "none",
                      boxShadow: "0 4px 14px rgba(2, 132, 199, 0.4)",
                    }}
                  >
                    {slide.ctaText} →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {slides.length > 1 && (
            <div style={{ position: "absolute", bottom: "16px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "8px" }}>
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  style={{
                    width: currentSlide === idx ? "24px" : "8px",
                    height: "8px",
                    borderRadius: "4px",
                    background: currentSlide === idx ? "#38bdf8" : "#64748b",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* WIDGET GESTUN (JIKA DIATUR DI BAWAH CAROUSEL) */}
        {settings.widgetPosition === "BELOW_CAROUSEL" && GestunWidget}

        {/* DAFTAR PRODUK DIGITAL */}
        <section id="products-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "1.3rem", color: "#f8fafc", margin: 0 }}>🛍️ Produk Digital Tersedia</h3>
            <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{products.length} Produk</span>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
              <p>Memuat daftar produk...</p>
            </div>
          ) : products.length === 0 ? (
            <div style={{ background: "#1e293b", padding: "32px", borderRadius: "12px", textAlign: "center", color: "#94a3b8", border: "1px solid #334155" }}>
              <p>Belum ada produk digital yang ditambahkan.</p>
            </div>
          ) : (
            <div 
              className="product-grid"
              style={{ 
                display: "grid", 
                gridTemplateColumns: `repeat(${settings.gridColumns}, minmax(0, 1fr))`, 
                gap: "20px" 
              }}
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  style={{
                    background: "#1e293b",
                    borderRadius: "14px",
                    border: "1px solid #334155",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    {product.imageUrl && (
                      <div style={{ width: "100%", height: "140px", borderRadius: "8px", overflow: "hidden", marginBottom: "12px", border: "1px solid #334155" }}>
                        <img src={product.imageUrl} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    )}

                    <div style={{ fontSize: "0.75rem", color: "#38bdf8", fontWeight: "bold", marginBottom: "6px" }}>
                      DIGITAL PRODUCT
                    </div>
                    <h4 style={{ fontSize: "1.1rem", color: "#f8fafc", margin: "0 0 8px 0" }}>
                      {product.name}
                    </h4>
                    <p style={{ fontSize: "0.82rem", color: "#94a3b8", margin: "0 0 16px 0", lineHeight: "1.5" }}>
                      {product.description || "Akses instan dan lisensi resmi."}
                    </p>
                  </div>

                  <div>
                    <div style={{ borderTop: "1px dashed #334155", paddingTop: "12px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Harga:</span>
                      <strong style={{ fontSize: "1.1rem", color: "#10b981" }}>
                        Rp {Number(product.price || 0).toLocaleString("id-ID")}
                      </strong>
                    </div>

                    <Link
                      href={`/checkout/${product.id}`}
                      style={{
                        display: "block",
                        textAlign: "center",
                        padding: "10px",
                        background: "#0284c7",
                        color: "#fff",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                        textDecoration: "none",
                      }}
                    >
                      Beli Sekarang
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* FOOTER DINAMIS */}
      <footer style={{ background: "#1e293b", borderTop: "1px solid #334155", padding: "24px 16px", textAlign: "center", color: "#94a3b8", fontSize: "0.85rem" }}>
        <p style={{ margin: 0 }}>{settings.footerText}</p>
      </footer>

    </div>
  );
}
