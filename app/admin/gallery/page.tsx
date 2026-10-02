"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const GAS_WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbwifb1OzsmJ6BeexYfLPV1av2LogDJ36Hc6CJCpmYfkhfFv6xKc-1mAin3nlI6WR8w/exec";

interface FolderItem {
  id: string;
  name: string;
  parentId: string;
  createdAt: string;
}

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  telegramFileId: string;
  publicUrl: string;
  parentId: string;
  createdAt: string;
}

export default function GalleryDrivePage() {
  // Autentikasi Admin State
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Galeri Data State
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigasi Folder (Breadcrumbs)
  const [currentFolder, setCurrentFolder] = useState<{ id: string; name: string }>({
    id: "root",
    name: "Drive Saya",
  });
  const [folderHistory, setFolderHistory] = useState<{ id: string; name: string }[]>([
    { id: "root", name: "Drive Saya" },
  ]);

  // Search Query
  const [searchQuery, setSearchQuery] = useState("");

  // Multi-Select / Checklist State
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  // Upload & UI State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Cek Sesi Login Admin saat Halaman Dimuat
  useEffect(() => {
    const savedPwd = sessionStorage.getItem("admin_session_pwd");
    if (savedPwd) {
      setAdminPassword(savedPwd);
      setIsAuthenticated(true);
      loadGalleryData(currentFolder.id, searchQuery);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadGalleryData(currentFolder.id, searchQuery);
    }
  }, [currentFolder, searchQuery, isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword.trim().length > 0) {
      sessionStorage.setItem("admin_session_pwd", adminPassword);
      setIsAuthenticated(true);
      loadGalleryData(currentFolder.id, searchQuery);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_session_pwd");
    setIsAuthenticated(false);
    setAdminPassword("");
  };

  const loadGalleryData = async (parentId: string, search: string) => {
    setLoading(true);
    // Reset Checklist saat memuat data baru
    setSelectedFolderIds([]);
    setSelectedFileIds([]);
    try {
      const res = await fetch(`/api/gallery?parentId=${parentId}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setFolders(data.folders || []);
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error("Gagal memuat galeri:", err);
    } finally {
      setLoading(false);
    }
  };

  // Convert File to Base64 untuk dikirim ke Google Apps Script (Telegram Agent)
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // Handler Upload File
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setUploadStatus(`Uploading ${i + 1}/${selectedFiles.length}: ${file.name}...`);

      try {
        const base64Data = await fileToBase64(file);

        // 1. Upload ke Telegram via Google Apps Script
        const gasRes = await fetch(GAS_WEBAPP_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            secretKey: "buanamedia12066911",
            fileName: file.name,
            category: "GALLERY",
            fileData: base64Data,
          }),
        });

        const gasData = await gasRes.json();

        if (!gasData || !gasData.success) {
          throw new Error(gasData?.message || "Gagal mengunggah ke Telegram");
        }

        // 2. Simpan Metadata File ke Firestore
        await fetch("/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "SAVE_FILE",
            parentId: currentFolder.id,
            fileData: {
              name: file.name,
              size: file.size,
              type: file.type,
              telegramFileId: gasData.telegramFileId,
              publicUrl: gasData.fileUrl || `/api/download/${gasData.telegramFileId}`,
            },
          }),
        });
      } catch (err: any) {
        alert(`Gagal upload ${file.name}: ${err.message}`);
      }
    }

    setIsUploading(false);
    setUploadStatus("");
    loadGalleryData(currentFolder.id, searchQuery);
    e.target.value = "";
  };

  // Handler Buat Folder Baru
  const handleCreateFolder = async () => {
    const folderName = prompt("Masukkan nama folder baru:");
    if (!folderName || !folderName.trim()) return;

    try {
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_FOLDER",
          name: folderName.trim(),
          parentId: currentFolder.id,
        }),
      });

      if (res.ok) {
        loadGalleryData(currentFolder.id, searchQuery);
      }
    } catch (err: any) {
      alert("Gagal membuat folder: " + err.message);
    }
  };

  // Handler Masuk Ke Dalam Folder
  const handleOpenFolder = (folder: FolderItem) => {
    const nextFolder = { id: folder.id, name: folder.name };
    setCurrentFolder(nextFolder);
    setFolderHistory((prev) => [...prev, nextFolder]);
  };

  // Navigasi Breadcrumb
  const handleBreadcrumbClick = (index: number) => {
    const newHistory = folderHistory.slice(0, index + 1);
    setFolderHistory(newHistory);
    setCurrentFolder(newHistory[newHistory.length - 1]);
  };

  // Handler Rename
  const handleRename = async (itemType: "folder" | "file", id: string, currentName: string) => {
    const newName = prompt(`Ubah nama ${itemType}:`, currentName);
    if (!newName || newName.trim() === currentName) return;

    try {
      const res = await fetch("/api/gallery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType, id, newName: newName.trim() }),
      });

      if (res.ok) {
        loadGalleryData(currentFolder.id, searchQuery);
      }
    } catch (err: any) {
      alert("Gagal merename: " + err.message);
    }
  };

  // Handler Delete Tunggal
  const handleDelete = async (itemType: "folder" | "file", id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${itemType} '${name}'?`)) return;

    try {
      const res = await fetch(`/api/gallery?id=${id}&type=${itemType}`, { method: "DELETE" });
      if (res.ok) {
        loadGalleryData(currentFolder.id, searchQuery);
      }
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  // --- LOGIK A TENTANG CHECKLIST / MULTI SELECT ---
  const toggleSelectFolder = (id: string) => {
    setSelectedFolderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectFile = (id: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected =
    folders.length + files.length > 0 &&
    selectedFolderIds.length === folders.length &&
    selectedFileIds.length === files.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedFolderIds([]);
      setSelectedFileIds([]);
    } else {
      setSelectedFolderIds(folders.map((f) => f.id));
      setSelectedFileIds(files.map((f) => f.id));
    }
  };

  // Handler Hapus Banyak Item Sekaligus
  const handleDeleteSelected = async () => {
    const totalCount = selectedFolderIds.length + selectedFileIds.length;
    if (totalCount === 0) return;

    if (!confirm(`Apakah Anda yakin ingin menghapus ${totalCount} item terpilih?`)) return;

    try {
      setLoading(true);
      // Hapus semua folder terpilih
      const deleteFolderPromises = selectedFolderIds.map((id) =>
        fetch(`/api/gallery?id=${id}&type=folder`, { method: "DELETE" })
      );

      // Hapus semua file terpilih
      const deleteFilePromises = selectedFileIds.map((id) =>
        fetch(`/api/gallery?id=${id}&type=file`, { method: "DELETE" })
      );

      await Promise.all([...deleteFolderPromises, ...deleteFilePromises]);

      setSelectedFolderIds([]);
      setSelectedFileIds([]);
      loadGalleryData(currentFolder.id, searchQuery);
    } catch (err: any) {
      alert("Gagal menghapus beberapa item terpilih: " + err.message);
      setLoading(false);
    }
  };

  // Copy Public Link File
  const handleCopyLink = (file: FileItem) => {
    const fullLink = `${window.location.origin}${file.publicUrl}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Format File Size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get Icon berdasarkan Tipe File
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎥";
    if (mimeType.startsWith("audio/")) return "🎵";
    if (mimeType.includes("pdf")) return "📕";
    if (mimeType.includes("zip") || mimeType.includes("rar")) return "📦";
    return "📄";
  };

  const totalSelectedCount = selectedFolderIds.length + selectedFileIds.length;

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", color: "#f8fafc", padding: "24px 16px", fontFamily: "sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        .drive-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; transition: all 0.2s; position: relative; }
        .drive-card:hover { border-color: #38bdf8; transform: translateY(-2px); }
        .drive-card.selected { border-color: #0284c7; background: #1e3a5f; }
        .btn-action { background: #334155; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: bold; }
        .btn-action:hover { background: #475569; }
        .checkbox-custom { width: 18px; height: 18px; cursor: pointer; accent-color: #0284c7; }
      `}</style>

      {!isAuthenticated ? (
        /* LAYAR LOGIN ADMIN */
        <div style={{ maxWidth: "400px", width: "100%", margin: "60px auto 0 auto", background: "#1e293b", padding: "24px", borderRadius: "16px", border: "1px solid #334155", textAlign: "center" }}>
          <h2 style={{ color: "#38bdf8", marginTop: 0 }}>Gallery Drive Admin Login</h2>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "24px" }}>
            Masukkan Password Admin untuk mengakses Cloud Storage Galeri.
          </p>
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
              Masuk Galeri
            </button>
          </form>
        </div>
      ) : (
        /* TAMPILAN DASHBOARD GALERI ADMIN */
        <div style={{ maxWidth: "1150px", margin: "0 auto" }}>
          
          {/* HEADER & ACTION BAR */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h1 style={{ fontSize: "1.4rem", color: "#38bdf8", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                📁 Cloud Storage Gallery
              </h1>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Terhubung dengan Telegram Storage Cluster</span>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              {totalSelectedCount > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  style={{ background: "#ef4444", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem" }}
                >
                  🗑 Hapus Terpilih ({totalSelectedCount})
                </button>
              )}

              <button
                onClick={handleCreateFolder}
                style={{ background: "#334155", color: "#38bdf8", border: "1px solid #0284c7", padding: "10px 16px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem" }}
              >
                ➕ Folder Baru
              </button>

              <label style={{ background: "#0284c7", color: "#fff", padding: "10px 18px", borderRadius: "8px", fontWeight: "bold", cursor: isUploading ? "not-allowed" : "pointer", fontSize: "0.85rem", display: "inline-block" }}>
                {isUploading ? "Mengunggah..." : "📤 Upload File"}
                <input
                  type="file"
                  multiple
                  disabled={isUploading}
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </label>

              <Link href="/admin" style={{ background: "#475569", color: "#fff", padding: "10px 16px", borderRadius: "8px", textDecoration: "none", fontSize: "0.85rem", fontWeight: "bold" }}>
                ← Dashboard Utama
              </Link>

              <button
                onClick={handleLogout}
                style={{ background: "#ef4444", border: "none", color: "#fff", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem" }}
              >
                Logout
              </button>
            </div>
          </div>

          {/* STATUS UPLOAD BAR */}
          {isUploading && (
            <div style={{ background: "rgba(2, 132, 199, 0.2)", border: "1px solid #0284c7", padding: "12px 16px", borderRadius: "10px", color: "#38bdf8", marginBottom: "20px", fontSize: "0.85rem", fontWeight: "bold" }}>
              ⏳ {uploadStatus}
            </div>
          )}

          {/* SEARCH & NAVIGASI BREADCRUMB & SELECT ALL BAR */}
          <div style={{ background: "#1e293b", padding: "16px", borderRadius: "12px", border: "1px solid #334155", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            
            {/* Breadcrumb Folder Path */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", color: "#cbd5e1", flexWrap: "wrap" }}>
              {folderHistory.map((folder, idx) => (
                <React.Fragment key={folder.id}>
                  <span
                    onClick={() => handleBreadcrumbClick(idx)}
                    style={{ cursor: "pointer", color: idx === folderHistory.length - 1 ? "#38bdf8" : "#94a3b8", fontWeight: idx === folderHistory.length - 1 ? "bold" : "normal" }}
                  >
                    {folder.name}
                  </span>
                  {idx < folderHistory.length - 1 && <span style={{ color: "#64748b" }}>/</span>}
                </React.Fragment>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* Checkbox Select All */}
              {(folders.length > 0 || files.length > 0) && (
                <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.85rem", color: "#cbd5e1" }}>
                  <input
                    type="checkbox"
                    className="checkbox-custom"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                  />
                  Pilih Semua
                </label>
              )}

              {/* Search Box */}
              <input
                type="text"
                placeholder="🔍 Cari berkas atau folder..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff", fontSize: "0.85rem", outline: "none", minWidth: "220px" }}
              />
            </div>
          </div>

          {loading ? (
            <p style={{ color: "#94a3b8", textAlign: "center", padding: "40px 0" }}>Memuat penyimpanan cloud...</p>
          ) : (
            <>
              {/* SEKSI FOLDER */}
              {folders.length > 0 && (
                <div style={{ marginBottom: "32px" }}>
                  <h2 style={{ fontSize: "1rem", color: "#94a3b8", marginBottom: "12px" }}>FOLDER ({folders.length})</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
                    {folders.map((folder) => {
                      const isSelected = selectedFolderIds.includes(folder.id);
                      return (
                        <div
                          key={folder.id}
                          className={`drive-card ${isSelected ? "selected" : ""}`}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                        >
                          <input
                            type="checkbox"
                            className="checkbox-custom"
                            checked={isSelected}
                            onChange={() => toggleSelectFolder(folder.id)}
                            style={{ marginRight: "10px" }}
                          />

                          <div
                            onClick={() => handleOpenFolder(folder)}
                            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", flex: 1, overflow: "hidden" }}
                          >
                            <span style={{ fontSize: "1.5rem" }}>📁</span>
                            <span style={{ fontWeight: "bold", fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#f8fafc" }}>
                              {folder.name}
                            </span>
                          </div>

                          <div style={{ display: "flex", gap: "4px" }}>
                            <button onClick={() => handleRename("folder", folder.id, folder.name)} className="btn-action" title="Rename">✏️</button>
                            <button onClick={() => handleDelete("folder", folder.id, folder.name)} className="btn-action" style={{ color: "#ef4444" }} title="Delete">🗑</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SEKSI FILE */}
              <div>
                <h2 style={{ fontSize: "1rem", color: "#94a3b8", marginBottom: "12px" }}>FILE ({files.length})</h2>
                {files.length === 0 && folders.length === 0 ? (
                  <div style={{ background: "#1e293b", padding: "40px", borderRadius: "12px", textAlign: "center", color: "#94a3b8", border: "1px solid #334155" }}>
                    Folder ini masih kosong. Klik <strong>Upload File</strong> atau buat <strong>Folder Baru</strong>.
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                    {files.map((file) => {
                      const isSelected = selectedFileIds.includes(file.id);
                      return (
                        <div
                          key={file.id}
                          className={`drive-card ${isSelected ? "selected" : ""}`}
                          style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                        >
                          <div>
                            {/* Checkbox Checklist Posisi Atas Kanan */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <span style={{ fontSize: "1.2rem" }}>{getFileIcon(file.type)}</span>
                              <input
                                type="checkbox"
                                className="checkbox-custom"
                                checked={isSelected}
                                onChange={() => toggleSelectFile(file.id)}
                              />
                            </div>

                            {/* Preview Gambar (Jika Tipe File Image) */}
                            {file.type.startsWith("image/") && (
                              <div style={{ width: "100%", height: "120px", borderRadius: "8px", overflow: "hidden", marginBottom: "12px", background: "#0f172a", border: "1px solid #334155" }}>
                                <img src={file.publicUrl} alt={file.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            )}

                            <div style={{ fontWeight: "bold", fontSize: "0.9rem", color: "#f8fafc", wordBreak: "break-all", marginBottom: "4px" }}>
                              {file.name}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "12px" }}>
                              {formatBytes(file.size)}
                            </div>
                          </div>

                          {/* Tombol Aksi File */}
                          <div style={{ borderTop: "1px solid #334155", paddingTop: "10px", display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "space-between" }}>
                            <button
                              onClick={() => handleCopyLink(file)}
                              style={{
                                background: copiedId === file.id ? "#10b981" : "#0284c7",
                                color: "#fff",
                                border: "none",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                fontWeight: "bold",
                                cursor: "pointer"
                              }}
                            >
                              {copiedId === file.id ? "✓ Link Copied!" : "🔗 Copy Link"}
                            </button>
                            
                            <div style={{ display: "flex", gap: "4px" }}>
                              <button onClick={() => handleRename("file", file.id, file.name)} className="btn-action" title="Rename">✏️</button>
                              <button onClick={() => handleDelete("file", file.id, file.name)} className="btn-action" style={{ color: "#ef4444" }} title="Delete">🗑</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
