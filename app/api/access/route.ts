// 3. Kelola / Buat Lisensi Jika Memang Diperlukan
    let licenseKey = "";
    if (hasLicense) {
      const licenseSnapshot = await db
        .collection("licenses")
        .where("invoiceNumber", "==", invoiceNumber)
        .limit(1)
        .get();

      if (!licenseSnapshot.empty) {
        licenseKey = licenseSnapshot.docs[0].data().licenseKey;
      } else {
        const licenseMode = productData?.licenseMode || "AUTO";

        if (licenseMode === "MANUAL" && Array.isArray(productData?.manualKeys) && productData.manualKeys.length > 0) {
          // Mode MANUAL: Ambil stok kunci lisensi pertama yang tersedia
          const manualKeys = [...productData.manualKeys];
          licenseKey = manualKeys.shift(); // Ambil kunci pertama

          // Update sisa stok kunci manual di Firestore
          await db.collection("products").doc(orderData.productId).update({
            manualKeys: manualKeys,
          });
        } else if (licenseMode === "GENERATOR" && productData?.generatorApiUrl) {
          // Mode GENERATOR: Panggil API External Keygen milik Anda
          try {
            const genRes = await fetch(productData.generatorApiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                customerEmail: orderData.customerEmail,
                customerName: orderData.customerName,
                invoiceNumber: invoiceNumber,
              }),
            });
            const genData = await genRes.json();
            licenseKey = genData?.licenseKey || genData?.key || `LIC-${Date.now()}`;
          } catch (e) {
            console.error("Generator Key API Error:", e);
            licenseKey = `LIC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          }
        } else {
          // Mode AUTO Default
          licenseKey = `LIC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        }

        // Simpan dokumen lisensi yang terbit
        await db.collection("licenses").add({
          licenseKey,
          invoiceNumber,
          customerEmail: orderData.customerEmail,
          productId: orderData.productId,
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
        });
      }
    }
