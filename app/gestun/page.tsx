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

const RANDOM_NAMES = ["Budi Santoso", "Eko Prasetyo", "Dewi Lestari", "Rian Hidayat", "Siti Rahma", "Agus Wijaya", "Andi Pratama"];
const RANDOM_PHONES = ["081234567890", "085712345678", "081398765432", "082111223344", "087855667788"];

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

  const [agreedTerms, setAgreedTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const rawAmount = parseInt(amountInput.replace(/\D/g, ""), 10) || 0;

  const selectedAdminRate = ADMIN_FEE_RATES[paymentMethod] || ADMIN_FEE_RATES["QRIS"];
  const adminFee = Math.round(rawAmount * selectedAdminRate.percent + selectedAdminRate.fixed);
  const serviceFee = Math.round(rawAmount * SERVICE_FEE_PERCENT);
  const totalDeduction = adminFee + serviceFee + TRANSFER_FEE;
  const netPayout = Math.max(0, rawAmount - totalDeduction);

  // Fungsi untuk mengisi data contoh secara acak (Random Data)
  const handleFillRandomData = () => {
    const randomName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const randomPhone = RANDOM_PHONES[Math.floor(Math.random() * RANDOM_PHONES.length)];
    const randomBank = BANK_OPTIONS[Math.floor(Math.random() * BANK_OPTIONS.length)];
    const randomAccountNum = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    setCustomerName(randomName);
    setCustomerPhone(randomPhone);
    setCustomerEmail(`${randomName.toLowerCase().replace(/\s+/g, ".")}@gmail.com`);
    setBankName(randomBank);
    setAccountNumber(randomAccountNum);
    setAccountHolder(randomName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!agreedTerms) {
      setErrorMessage("Anda harus menyetujui Syarat & Ketentuan layanan.");
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
        
        {/* Header Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <Link href="/" style={{ color: "#38bdf8", textDecoration: "none", fontSize: "0.85rem", fontWeight: "bold" }}>
            ← Kembali ke Beranda
          </Link>
          <button
            type="button"
            onClick={handleFillRandomData}
            style={{
              background: "#334155",
              color: "#38bdf8",
              border: "1px solid #0284c7",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "0.75rem",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            🎲 Isi Contoh Random
          </button>
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
            <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>Nama Lengkap Pemohon</label>
            <input type="text" required placeholder="Sesuai KTP / Rekening" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>No. WhatsApp Active</label>
            <input type="tel" required placeholder="081234567890" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>Email Penerima Bukti</label>
            <input type="email" required placeholder="email@domain.com" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>Metode Bayar / Pencairan via</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }}>
              <option value="QRIS">{ADMIN_FEE_RATES.QRIS.name}</option>
              <option value="CREDIT_CARD">{ADMIN_FEE_RATES.CREDIT_CARD.name}</option>
              <option value="VA_BCA">{ADMIN_FEE_RATES.VA_BCA.name}</option>
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#38bdf8", fontWeight: "bold", marginBottom: "4px" }}>Nominal Tarik Tunai (Rp)</label>
            <input type="number" required min="20000" step="1000" placeholder="100000" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #0284c7", background: "#0f172a", color: "#38bdf8", fontSize: "1.1rem", fontWeight: "bold", boxSizing: "border-box" }} />
          </div>

          {/* Target Rekening / E-Wallet dengan Dropdown */}
          <div style={{ background: "#0f172a", padding: "14px", borderRadius: "10px", border: "1px solid #334155", marginBottom: "16px" }}>
            <span style={{ fontSize: "0.8rem", color: "#38bdf8", display: "block", fontWeight: "bold", marginBottom: "8px" }}>Tujuan Rekening / E-Wallet Pencairan</span>
            
            <div style={{ marginBottom: "8px" }}>
              <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "4px" }}>Pilih Bank / E-Wallet:</label>
              <select value={bankName} onChange={(e) => setBankName(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #475569", background: "#1e293b", color: "#fff", boxSizing: "border-box" }}>
                {BANK_OPTIONS.map((bank) => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "8px" }}>
              <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "4px" }}>Nomor Rekening / HP E-Wallet:</label>
              <input type="text" required placeholder="Contoh: 1234567890" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #475569", background: "#1e293b", color: "#fff", boxSizing: "border-box" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "4px" }}>Nama Pemilik Rekening (Sesuai Bank):</label>
              <input type="text" required placeholder="Atas Nama Penerima" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #475569", background: "#1e293b", color: "#fff", boxSizing: "border-box" }} />
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

          {/* Syarat & Ketentuan Layanan Gestun */}
          <div style={{ background: "#0f172a", padding: "12px", borderRadius: "8px", border: "1px solid #334155", marginBottom: "20px" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "0.78rem", color: "#cbd5e1", lineHeight: "1.4" }}>
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                style={{ marginTop: "2px", cursor: "pointer" }}
              />
              <span>
                Saya menyetujui <strong>Syarat & Ketentuan Layanan</strong>: Dana bersih akan ditransfer otomatis ke rekening penerima setelah pembayaran diverifikasi oleh Payment Gateway (1-5 menit). Pastikan nomor rekening dan nama pemilik sudah benar.
              </span>
            </label>
          </div>

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
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Menghubungkan Gateway..." : `Beli / Bayar Rp ${rawAmount.toLocaleString("id-ID")}`}
          </button>
        </form>
      </div>
    </div>
  );
}
