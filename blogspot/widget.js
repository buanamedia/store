(function () {
  // Ambil URL Domain Vercel dari atribut script tag atau default ke domain utama
  const scriptTag = document.currentScript;
  const baseUrl = scriptTag ? new URL(scriptTag.src).origin : "https://store.yourdomain.com";

  function formatRupiah(amount) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function injectStyles() {
    if (document.getElementById("store-widget-styles")) return;
    const style = document.createElement("style");
    style.id = "store-widget-styles";
    style.innerHTML = `
      .store-card {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 20px;
        max-width: 420px;
        background-color: #ffffff;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        margin: 16px 0;
        box-sizing: border-box;
      }
      .store-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }
      .store-title {
        font-size: 18px;
        font-weight: 700;
        color: #111827;
        margin: 0;
      }
      .store-badge {
        font-size: 11px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 9999px;
        text-transform: uppercase;
      }
      .store-badge-online { background-color: #e0f2fe; color: #0369a1; }
      .store-badge-download { background-color: #f3e8ff; color: #6b21a8; }
      .store-price {
        font-size: 20px;
        font-weight: 800;
        color: #059669;
        margin: 8px 0;
      }
      .store-description {
        font-size: 13px;
        color: #4b5563;
        line-height: 1.5;
        margin-bottom: 16px;
      }
      .store-button {
        display: block;
        width: 100%;
        text-align: center;
        background-color: #2563eb;
        color: #ffffff;
        font-weight: 600;
        font-size: 14px;
        padding: 10px 16px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        transition: background-color 0.2s ease;
        text-decoration: none;
        box-sizing: border-box;
      }
      .store-button:hover { background-color: #1d4ed8; }
      .store-loading { font-size: 13px; color: #9ca3af; text-align: center; padding: 12px; }
      .store-error { font-size: 13px; color: #dc2626; text-align: center; padding: 12px; }
    `;
    document.head.appendChild(style);
  }

  async function renderWidget(element) {
    const productId = element.getAttribute("data-product-id");
    if (!productId) return;

    element.innerHTML = `<div class="store-loading">Memuat detail produk...</div>`;

    try {
      const response = await fetch(`${baseUrl}/api/products/${productId}`);
      if (!response.ok) throw new Error("Produk tidak ditemukan");

      const product = await response.json();

      const badgeClass = product.type === "online" ? "store-badge-online" : "store-badge-download";
      const badgeLabel = product.type === "online" ? `Online (${product.durationDays || 30} Hari)` : `Download v${product.version || "1.0"}`;

      element.innerHTML = `
        <div class="store-card">
          <div class="store-card-header">
            <h3 class="store-title">${product.name}</h3>
            <span class="store-badge ${badgeClass}">${badgeLabel}</span>
          </div>
          <div class="store-price">${formatRupiah(product.price)}</div>
          <p class="store-description">${product.description || ""}</p>
          <button class="store-button" onclick="window.STORE_BUY('${product.id}')">
            BELI SEKARANG
          </button>
        </div>
      `;
    } catch (err) {
      element.innerHTML = `<div class="store-error">Gagal memuat produk (${productId})</div>`;
    }
  }

  // Global handler saat tombol BELI SEKARANG ditekan
  window.STORE_BUY = function (productId) {
    // Redirect / Trigger Modal Checkout
    window.location.href = `${baseUrl}/checkout?productId=${productId}`;
  };

  document.addEventListener("DOMContentLoaded", function () {
    injectStyles();
    const containers = document.querySelectorAll(".store-product");
    containers.forEach((container) => renderWidget(container));
  });
})();
