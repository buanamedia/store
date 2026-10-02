import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

// GET: Ambil daftar folder & file berdasarkan parentId
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId") || "root";
    const search = searchParams.get("search") || "";

    let foldersQuery = db.collection("gallery_folders");
    let filesQuery = db.collection("gallery_files");

    if (search.trim()) {
      // Jika pencarian aktif
      const foldersSnap = await db
        .collection("gallery_folders")
        .where("name", ">=", search)
        .where("name", "<=", search + "\uf8ff")
        .get();

      const filesSnap = await db
        .collection("gallery_files")
        .where("name", ">=", search)
        .where("name", "<=", search + "\uf8ff")
        .get();

      const folders = foldersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const files = filesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      return NextResponse.json({ success: true, folders, files });
    }

    // Ambil berdasar parentId
    const foldersSnap = await foldersQuery.where("parentId", "==", parentId).get();
    const filesSnap = await filesQuery.where("parentId", "==", parentId).get();

    const folders = foldersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const files = filesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ success: true, folders, files });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Buat Folder Baru atau Simpan Metadata File
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, name, parentId = "root", fileData } = body;

    if (action === "CREATE_FOLDER") {
      if (!name) return NextResponse.json({ success: false, message: "Nama folder wajib diisi" }, { status: 400 });

      const folderRef = await db.collection("gallery_folders").add({
        name,
        parentId,
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({ success: true, folderId: folderRef.id });
    }

    if (action === "SAVE_FILE") {
      const fileRef = await db.collection("gallery_files").add({
        name: fileData.name,
        size: fileData.size,
        type: fileData.type,
        telegramFileId: fileData.telegramFileId,
        publicUrl: fileData.publicUrl || `/api/download/${fileData.telegramFileId}`,
        parentId: parentId || "root",
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({ success: true, fileId: fileRef.id });
    }

    return NextResponse.json({ success: false, message: "Aksi tidak dikenal" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PATCH: Rename Folder / File
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { itemType, id, newName } = body; // itemType: "folder" | "file"

    if (!id || !newName) {
      return NextResponse.json({ success: false, message: "ID dan Nama Baru wajib diisi" }, { status: 400 });
    }

    const collectionName = itemType === "folder" ? "gallery_folders" : "gallery_files";
    await db.collection(collectionName).doc(id).update({ name: newName });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE: Hapus Folder / File
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const itemType = searchParams.get("type"); // "folder" | "file"

    if (!id || !itemType) {
      return NextResponse.json({ success: false, message: "ID dan Tipe wajib diisi" }, { status: 400 });
    }

    if (itemType === "folder") {
      await db.collection("gallery_folders").doc(id).delete();
      // Opsi: Hapus item di dalamnya (recursive cleanup jika diperlukan)
    } else {
      await db.collection("gallery_files").doc(id).delete();
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
