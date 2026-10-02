"use client";

import React, { useState } from "react";
import Link from "next/link";

const ADMIN_FEE_RATES: Record<string, { percent: number; fixed: number; name: string }> = {
  QRIS: { percent: 0.007, fixed: 0, name: "QRIS (0.7%)" },
  CREDIT_CARD: { percent: 0.029, fixed: 2000, name: "Kartu Kredit / Paylater (2.9% + Rp 2.000)" },
  VA_BCA: { percent: 0, fixed: 4000, name: "Virtual Account BCA (Rp 4.000)" },
};

const SERVICE_FEE_PERCENT = 0.07;
const TRANSFER_FEE = 2500;

export default function GestunPage() {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("QRIS");

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

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
        
        {/* Tombol Kembali ke Home */}
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
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>Nama Lengkap</label>
            <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>No. WhatsApp</label>
            <input type="tel" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>Email</label>
            <input type="email" required value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>Metode Bayar</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", boxSizing: "border-box" }}>
              <option value="QRIS">{ADMIN_FEE_RATES.QRIS.name}</option>
              <option value="CREDIT_CARD">{ADMIN_FEE_RATES.CREDIT_CARD.name}</option>
              <option value="VA_BCA">{ADMIN_FEE_RATES.VA_BCA.name}</option>
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#38bdf8", fontWeight: "bold", marginBottom: "4px" }}>Nominal Tarik Tunai (Rp)</label>
            <input type="number" required min="20000" step="1000" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #0284c7", background: "#0f172a", color: "#38bdf8", fontSize: "1.1rem", fontWeight: "bold", boxSizing: "border-box" }} />
          </div>

          <div style={{ background: "#0f172a", padding: "14px", borderRadius: "10px", border: "1px solid #334155", marginBottom: "16px" }}>
            <span style={{ fontSize: "0.8rem", color: "#38bdf8", display: "block", fontWeight: "bold", marginBottom: "8px" }}>Tujuan Pencairan</span>
            <input type="text" required placeholder="Nama Bank / E-Wallet" value={bankName} onChange={(e) => setBankName(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #475569", background: "#1e293b", color: "#fff", marginBottom: "8px", boxSizing: "border-box" }} />
            <input type="text" required placeholder="No. Rekening / No. E-Wallet" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #475569", background: "#1e293b", color: "#fff", marginBottom: "8px", boxSizing: "border-box" }} />
            <input type="text" required placeholder="Atas Nama Penerima" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #475569", background: "#1e293b", color: "#fff", boxSizing: "border-box" }} />
          </div>

          {/* RINCIAN BIAYA LENGKAP */}
          <div style={{ background: "#0f172a", padding: "14px", borderRadius: "10px", border: "1px solid #334155", fontSize: "0.82rem", marginBottom: "20px" }}>
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

          <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Menghubungkan Gateway..." : `Beli / Bayar Rp ${rawAmount.toLocaleString("id-ID")}`}
          </button>
        </form>
      </div>
    </div>
  );
}
