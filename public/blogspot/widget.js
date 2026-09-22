(function () {
  // Otomatis mengambil domain asal dari mana file script ini dimuat
  const currentScript = document.currentScript || (function() {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();
  
  let API_BASE_URL = "https://store-indol-seven.vercel.app";
  if (currentScript && currentScript.src) {
    try {
      const urlObj = new URL(currentScript.src);
      API_BASE_URL = urlObj.origin;
    } catch (e) {
      console.error("Gagal mendeteksi origin script:", e);
    }
  }

  // Inject Styling Modal & Status Tombol Stok Habis
  const style = document.createElement("style");
  style.innerHTML = `
    .se-modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 999999; opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
    }
    .se-modal-overlay.active { opacity: 1; pointer-events: auto; }
    .se-modal-card {
      background: #1e293b; color: #f8fafc; border: 1px solid #334155;
      padding: 24px; border-radius: 16px; width: 90%; max-width: 400px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); font-family: sans-serif;
    }
    .se-modal-card h3 { margin: 0 0 16px 0; font-size: 1.25rem; color: #fff; }
    .se-input-group { margin-bottom: 12px; text-align: left; }
    .se-input-group label { display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 4px; }
    .se-input-group input {
      width: 100% !important; padding: 10px !important; border-radius: 8px !important; border: 1px solid #475569 !important;
      background-color: #0f172a !important; color: #ffffff !important; box-sizing: border-box !important; font-size: 0.95rem !important;
    }
    .se-input-group input::placeholder { color: #64748b !important; }
    .se-btn-submit {
      width: 100% !important; padding: 12px !important; background: #2563eb !important; color: #fff !important; border: none !important;
      border-radius: 8px !important; font-weight: bold !important; cursor: pointer !important; margin-top: 8px !important; font-size: 1rem !important;
    }
    .se-btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .se-btn-close {
      background: transparent !important; border: none !important; color: #94a3b8 !important; float: right !important;
      font-size: 1.2rem !important; cursor: pointer !important;
    }
    
    /* Styling Presisi untuk Tombol Stok Habis */
    .se-buy-btn.out-of-stock, [data-store-product].out-of-stock {
      background-color: #64748b !important;
      color: #f1f5f9 !important;
      cursor: not-allowed !important;
      opacity: 0.85 !important;
      border: none !important;
      border-radius: 8px !important;
      height: 48px !important;
      padding: 0 24px !important;
      font-size: 15px !important;
      font-weight: bold !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-sizing: border-box !important;
      min-width: 160px !important;
    }
  `;
  document.head.appendChild(style);

  // --- FUNGSI CEK STOK OTOMATIS SAAT HALAMAN DIMUAT ---
  async function checkAllProductStocks() {
    const buttons = document.querySelectorAll(".se-buy-btn, [data-store-product]");
    
    buttons.forEach(async (btn) => {
      const productId = btn.getAttribute("data-store-product") || btn.getAttribute("id");
      if (!productId) return;

      try {
        const res = await fetch(`${API_BASE_URL}/api/products/${productId}`);
        const data = await res.json();

        if (data.success && data.product && data.product.isOutOfStock) {
          // Ubah Tampilan Tombol Menjadi Stok Habis
          btn.classList.add("out-of-stock");
          btn.setAttribute("disabled", "true");
          btn.style.pointerEvents = "none";
          btn.innerText = "❌ Stok Habis";
        }
      } catch (err) {
        console.error("Gagal memeriksa stok produk:", productId, err);
      }
    });
  }

  // Jalankan Pengecekan Stok Begitu DOM Siap
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkAllProductStocks);
  } else {
    checkAllProductStocks();
  }

  function initModal() {
    if (document.getElementById("seModal")) return;

    const modalHTML = `
      <div class="se-modal-overlay" id="seModal">
        <div class="se-modal-card">
          <button class="se-btn-close" id="seBtnClose">&times;</button>
          <h3>Lengkapi Data Pembelian</h3>
          <form id="seCheckoutForm">
            <input type="hidden" id="seProductId" value="" />
            <div class="se-input-group">
              <label for="seCustomerName">Nama Lengkap</label>
              <input type="text" id="seCustomerName" required placeholder="Contoh: Budi Santoso" />
            </div>
            <div class="se-input-group">
              <label for="seCustomerEmail">Email (Akses Produk/Lisensi)</label>
              <input type="email" id="seCustomerEmail" required placeholder="nama@email.com" />
            </div>
            <button type="submit" class="se-btn-submit" id="seBtnSubmit">Bayar Sekarang</button>
          </form>
        </div>
      </div>
    `;
    const div = document.createElement("div");
    div.innerHTML = modalHTML;
    document.body.appendChild(div);

    const modal = document.getElementById("seModal");
    const form = document.getElementById("seCheckoutForm");
    const btnClose = document.getElementById("seBtnClose");
    const btnSubmit = document.getElementById("seBtnSubmit");
    const inputProductId = document.getElementById("seProductId");

    btnClose.onclick = () => modal.classList.remove("active");
    window.onclick = (e) => { if (e.target === modal) modal.classList.remove("active"); };

    form.onsubmit = async function (e) {
      e.preventDefault();
      btnSubmit.disabled = true;
      btnSubmit.innerText = "Memproses...";

      const productId = inputProductId.value;
      const customerName = document.getElementById("seCustomerName").value;
      const customerEmail = document.getElementById("seCustomerEmail").value;

      try {
        const response = await fetch(`${API_BASE_URL}/api/checkout`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ productId, customerName, customerEmail }),
        });

        const data = await response.json();

        if (response.ok && data.success && data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          alert("Gagal memproses transaksi: " + (data.message || "Terjadi kesalahan server"));
          btnSubmit.disabled = false;
          btnSubmit.innerText = "Bayar Sekarang";
        }
      } catch (err) {
        console.error(err);
        alert("Gagal terhubung ke API Server (" + err.message + "). Pastikan backend Vercel aktif.");
        btnSubmit.disabled = false;
        btnSubmit.innerText = "Bayar Sekarang";
      }
    };
  }

  // Listener Klik Tombol
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-store-product], .se-buy-btn");
    
    // Jangan buka modal jika tombol dalam keadaan Stok Habis / Disabled
    if (btn && !btn.hasAttribute("disabled") && !btn.classList.contains("out-of-stock")) {
      e.preventDefault();
      initModal();
      
      const productId = btn.getAttribute("data-store-product") || btn.getAttribute("id") || "clipprovit-license";
      const inputProductId = document.getElementById("seProductId");
      const modal = document.getElementById("seModal");

      if (inputProductId && modal) {
        inputProductId.value = productId;
        modal.classList.add("active");
      }
    }
  });
})();
