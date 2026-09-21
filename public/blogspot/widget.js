(function () {
  // Gunakan domain Vercel langsung untuk menghindari masalah SSL/CORS
  const API_BASE_URL = "https://store-indol-seven.vercel.app";

  // Inject Styling Modal
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
      width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #475569;
      background: #0f172a; color: #fff; box-sizing: border-box; font-size: 0.95rem;
    }
    .se-btn-submit {
      width: 100%; padding: 12px; background: #2563eb; color: #fff; border: none;
      border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 8px; font-size: 1rem;
    }
    .se-btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .se-btn-close {
      background: transparent; border: none; color: #94a3b8; float: right;
      font-size: 1.2rem; cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  // Inject Elemen Modal HTML
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, customerName, customerEmail }),
        });

        const data = await response.json();

        if (data.success && data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          alert("Gagal memproses transaksi: " + (data.message || "Terjadi kesalahan"));
          btnSubmit.disabled = false;
          btnSubmit.innerText = "Bayar Sekarang";
        }
      } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan jaringan atau server.");
        btnSubmit.disabled = false;
        btnSubmit.innerText = "Bayar Sekarang";
      }
    };
  }

  // Event Listener Tombol
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-store-product], .se-buy-btn");
    if (btn) {
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
