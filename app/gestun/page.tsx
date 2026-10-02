"use client";

import React, { useState } from "react";
import Link from "next/link";

const ADMIN_FEE_RATES: Record<string, { percent: number; fixed: number; name: string }> = {
  QRIS: { percent: 0.007, fixed: 0, name: "QRIS (0.7%)" },
  CREDIT_CARD: { percent: 0.029, fixed: 2000, name: "Kartu Kredit / Paylater (2.9% + Rp 2.000)" },
  VA_BCA: { percent: 0, fixed: 4000, name: "Virtual Account BCA (Rp 4.000)" },
};

const BANK_OPTIONS = [
  "BCA",
  "Mandiri",
  "BRI",
  "BNI",
  "CIMB Niaga",
  "Permata",
  "Danamon",
  "Bank Jago",
  "Seabank",
  "GoPay",
  "OVO",
  "DANA",
  "ShopeePay",
  "LinkAja",
];

const SERVICE_FEE_PERCENT = 0.07;
const TRANSFER_FEE = 2500;

export default function GestunPage() {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("QRIS");

  const [bankName, setBankName] = useState("BCA");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const rawAmount = parseInt(amountInput.replace(/\D/g, ""), 10) || 0;

  const selectedAdminRate = ADMIN_FEE_RATES[paymentMethod] || ADMIN_FEE_RATES["QRIS"];
  const adminFee = Math.round(rawAmount * selectedAdminRate.percent + selectedAdminRate.fixed);
  const serviceFee = Math.round(rawAmount * SERVICE_FEE_PERCENT);
  const totalDeduction = adminFee + serviceFee + TRANSFER_FEE;
  const netPayout = Math.max(0, rawAmount - totalDeduction);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!agreedTerms) {
      setErrorMessage("Anda wajib menyetujui Syarat & Ketentuan sebelum melanjutkan transaksi.");
      return;
    }

    if (!customerName || !customerPhone || !customerEmail || rawAmount < 20000 || !bankName || !accountNumber || !accountHolder) {
      setErrorMessage("Mohon lengkapi semua data pencairan.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: "GESTUN",
          customerName,
          customerEmail,
          customerPhone,
          amount: rawAmount,
          paymentMethod,
          gestunDetails: {
            bankName,
            accountNumber,
            accountHolder,
            adminFee,
            serviceFee,
            transferFee: TRANSFER_FEE,
            netPayout,
          },
        }),
      });

      const data = await res.json();

      if (res.ok && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setErrorMessage(data.message || "Gagal memproses pembayaran.");
      }
    } catch (err: any) {
      setErrorMessage("Terjadi kesalahan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", color: "#f8fafc", padding: "40px 16px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "520px", margin: "0 auto", background: "#1e293b", padding: "28px", borderRadius: "16px", border: "1px solid #334155", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}>
        
        {/* Navigasi Kembali */}
        <div style={{ marginBottom: "16px" }}>
          <Link href="/" style={{ color: "#38bdf8", textDecoration: "none", fontSize: "0.85rem", fontWeight: "bold" }}>
            ← Kembali ke Beranda
          </Link>
        </div>

        <h1 style={{ fontSize: "1.4rem", color: "#38bdf8", textAlign: "center", marginTop: 0, marginBottom: "20px" }}>⚡ Form Tarik Tunai / Gestun</h1>

        {errorMessage && (
          <div style={{ background: "rgba(239, 68, 68, 0.2)", border: "1px solid #ef4444", color: "#fca5a5", padding: "10px 14px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "16px" }}>
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Data Pemohon */}
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>Nama Lengkap</label>
            <input
              type="text"
              required
              placeholder="Contoh: Agus Siahaan"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>No. WhatsApp</label>
            <input
              type="tel"
              required
              placeholder="Contoh: 081234567890"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>Email</label>
            <input
              type="email"
              required
              placeholder="Contoh: agus@buanamedia.my.id"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>Metode Bayar</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }}
            >
              <option value="QRIS">{ADMIN_FEE_RATES.QRIS.name}</option>
              <option value="CREDIT_CARD">{ADMIN_FEE_RATES.CREDIT_CARD.name}</option>
              <option value="VA_BCA">{ADMIN_FEE_RATES.VA_BCA.name}</option>
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#38bdf8", fontWeight: "bold", marginBottom: "4px" }}>Nominal Tarik Tunai (Rp)</label>
            <input
              type="number"
              required
              min="20000"
              step="1000"
              placeholder="Contoh: 100000"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #0284c7", background: "#0f172a", color: "#38bdf8", fontSize: "1.1rem", fontWeight: "bold", boxSizing: "border-box" }}
            />
          </div>

          {/* Tujuan Rekening / E-Wallet */}
          <div style={{ background: "#0f172a", padding: "14px", borderRadius: "10px", border: "1px solid #334155", marginBottom: "16px" }}>
            <span style={{ fontSize: "0.8rem", color: "#38bdf8", display: "block", fontWeight: "bold", marginBottom: "8px" }}>Tujuan Rekening / E-Wallet Pencairan</span>
            
            <div style={{ marginBottom: "8px" }}>
              <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "4px" }}>Nama Bank / E-Wallet</label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #475569", background: "#1e293b", color: "#fff", boxSizing: "border-box" }}
              >
                {BANK_OPTIONS.map((bank) => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "8px" }}>
              <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "4px" }}>No. Rekening / No. E-Wallet</label>
              <input
                type="text"
                required
                placeholder="Contoh: 1234567890"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #475569", background: "#1e293b", color: "#fff", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "4px" }}>Atas Nama Penerima</label>
              <input
                type="text"
                required
                placeholder="Contoh: Agus Siahaan"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #475569", background: "#1e293b", color: "#fff", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* Rincian Potongan Biaya */}
          <div style={{ background: "#0f172a", padding: "14px", borderRadius: "10px", border: "1px solid #334155", fontSize: "0.82rem", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1", marginBottom: "6px" }}>
              <span>Biaya Payment Gateway ({selectedAdminRate.name}):</span>
              <span>Rp {adminFee.toLocaleString("id-ID")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1", marginBottom: "6px" }}>
              <span>Biaya Layanan Gestun (7%):</span>
              <span>Rp {serviceFee.toLocaleString("id-ID")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1", marginBottom: "6px" }}>
              <span>Biaya Transfer Bank:</span>
              <span>Rp {TRANSFER_FEE.toLocaleString("id-ID")}</span>
            </div>
            <div style={{ borderTop: "1px dashed #334155", paddingTop: "8px", marginTop: "8px", display: "flex", justifyContent: "space-between", color: "#f8fafc", fontWeight: "bold" }}>
              <span>Total Potongan:</span>
              <span style={{ color: "#ef4444" }}>- Rp {totalDeduction.toLocaleString("id-ID")}</span>
            </div>
            <div style={{ borderTop: "1px solid #334155", paddingTop: "10px", marginTop: "8px", display: "flex", justifyContent: "space-between", color: "#10b981", fontSize: "0.95rem", fontWeight: "bold" }}>
              <span>Dana Bersih Diterima:</span>
              <span>Rp {netPayout.toLocaleString("id-ID")}</span>
            </div>
          </div>

          {/* Checkbox Syarat & Ketentuan */}
          <div style={{ background: "#0f172a", padding: "12px 14px", borderRadius: "8px", border: "1px solid #334155", marginBottom: "20px" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "0.8rem", color: "#cbd5e1", lineHeight: "1.4" }}>
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                style={{ marginTop: "2px", cursor: "pointer", width: "16px", height: "16px" }}
              />
              <span>
                Saya menyetujui{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTermsModal(true);
                  }}
                  style={{ background: "none", border: "none", color: "#38bdf8", textDecoration: "underline", cursor: "pointer", padding: 0, font: "inherit", fontWeight: "bold" }}
                >
                  Syarat & Ketentuan Layanan
                </button>{" "}
                pencairan dana ini.
              </span>
            </label>
          </div>

          {/* Tombol Submit (Disabled jika belum dicentang) */}
          <button
            type="submit"
            disabled={loading || !agreedTerms}
            style={{
              width: "100%",
              padding: "14px",
              background: agreedTerms ? "#2563eb" : "#334155",
              color: agreedTerms ? "#fff" : "#94a3b8",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: agreedTerms && !loading ? "pointer" : "not-allowed",
              transition: "background 0.2s"
            }}
          >
            {loading ? "Menghubungkan Gateway..." : `Beli / Bayar Rp ${rawAmount.toLocaleString("id-ID")}`}
          </button>
        </form>
      </div>

      {/* POPUP MODAL SYARAT & KETENTUAN */}
      {showTermsModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}>
          <div style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", padding: "24px", borderRadius: "16px", width: "100%", maxWidth: "500px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #334155", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, color: "#38bdf8", fontSize: "1.1rem" }}>📜 Syarat & Ketentuan Layanan Gestun</h3>
              <button onClick={() => setShowTermsModal(false)} style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: "1.3rem", cursor: "pointer", padding: "0 8px" }}>&times;</button>
            </div>

            <div style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: "1.6" }}>
              <p style={{ marginTop: 0 }}>Dengan melanjutkan transaksi Gestun / Tarik Tunai di STORE Engine, Anda menyatakan dan menyetujui ketentuan berikut:</p>
              
              <ol style={{ paddingLeft: "20px", margin: "12px 0" }}>
                <li style={{ marginBottom: "8px" }}>
                  <strong>Kepemilikan Sah:</strong> Sumber dana yang digunakan (Kartu Kredit / QRIS / Paylater) adalah milik Anda pribadi yang sah secara hukum.
                </li>
                <li style={{ marginBottom: "8px" }}>
                  <strong>Validitas Rekening Penerima:</strong> Pastikan Nama Bank, Nomor Rekening/E-Wallet, dan Nama Pemilik Rekening sesuai dan aktif. Kesalahan penginputan nomor rekening sepenuhnya menjadi tanggung jawab pemohon.
                </li>
                <li style={{ marginBottom: "8px" }}>
                  <strong>Proses Pencairan Otomatis:</strong> Dana bersih (*Net Payout*) akan ditransfer otomatis ke rekening penerima dalam waktu <strong>1 - 5 menit</strong> setelah status pembayaran terkonfirmasi LUNAS oleh Payment Gateway.
                </li>
                <li style={{ marginBottom: "8px" }}>
                  <strong>Skema Biaya Potongan:</strong> Transaksi dikenakan biaya Gateway sesuai kanal bayar, Biaya Layanan Gestun sebesar 7%, dan Biaya Transfer Bank sebesar Rp 2.500.
                </li>
                <li style={{ marginBottom: "8px" }}>
                  <strong>Finalitas Transaksi:</strong> Pembayaran yang sudah dikonfirmasi tidak dapat dibatalkan atau ditarik kembali (*non-refundable*).
                </li>
              </ol>
            </div>

            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => {
                  setAgreedTerms(true);
                  setShowTermsModal(false);
                }}
                style={{ flex: 1, padding: "10px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem" }}
              >
                Saya Setuju & Paham
              </button>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                style={{ padding: "10px 16px", background: "#475569", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem" }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
