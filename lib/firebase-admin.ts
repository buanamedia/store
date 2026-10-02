import * as admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

// Memastikan string \n dikonversi menjadi enter/newline yang valid
// serta membersihkan tanda petik di awal/akhir string
const rawKey = process.env.FIREBASE_PRIVATE_KEY || "";
const privateKey = rawKey
  .replace(/^"|"$/g, "")
  .replace(/\\n/g, "\n");

if (!admin.apps.length) {
  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("Firebase Admin Service Account connected.");
    } catch (error) {
      console.error("Firebase Admin Initialization Error:", error);
    }
  } else {
    console.warn("Firebase credentials missing. Check Vercel Environment Variables.");
  }
}

export const db = admin.apps.length ? admin.firestore() : ({} as admin.firestore.Firestore);
