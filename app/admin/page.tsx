const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("adminPassword", adminPassword);
      formData.append("id", id.trim().toLowerCase().replace(/\s+/g, "-"));
      formData.append("name", name);
      formData.append("price", price);
      formData.append("type", type);
      formData.append("hasLicense", String(hasLicense));
      
      if (hasLicense) {
        formData.append("licenseMode", licenseMode);
        if (licenseMode === "MANUAL") formData.append("manualKeys", manualKeys);
        if (licenseMode === "GENERATOR") formData.append("generatorApiUrl", generatorApiUrl);
      }

      if (type === "ACCESS") formData.append("appUrl", appUrl);
      if (type === "DOWNLOAD" && file) formData.append("file", file);

      const res = await fetch("/api/admin/products", {
        method: "POST",
        body: formData,
      });

      // Tangani jika respons server bukan JSON (misal HTML error 413/504)
      const textRes = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(textRes);
      } catch (pErr) {
        throw new Error(res.status === 413 ? "Ukuran file terlalu besar (Maksimal 4.5 MB)." : "Respon Server Error: " + textRes.substring(0, 100));
      }

      if (res.ok && data.success) {
        setMessage({ type: "success", text: `Berhasil! Produk '${id}' tersimpan.` });
        setId("");
        setName("");
        setPrice("");
        setAppUrl("");
        setManualKeys("");
        setGeneratorApiUrl("");
        setFile(null);
        loadProducts(adminPassword);
      } else {
        setMessage({ type: "error", text: data.message || "Gagal menyimpan produk." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Terjadi kesalahan: " + err.message });
    } finally {
      setLoading(false);
    }
  };
