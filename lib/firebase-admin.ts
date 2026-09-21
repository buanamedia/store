import * as admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

// Memastikan string \n diubah menjadi enter/newline yang sah
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n").replace(/^"|"$/g, "")
  : undefined;

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
      console.log("Firebase Admin initialized successfully.");
    } catch (error) {
      console.error("Firebase Admin initialization error:", error);
    }
  } else {
    console.warn("Firebase Admin credentials missing. Lazy loading active.");
  }
}

export const db = admin.apps.length ? admin.firestore() : ({} as admin.firestore.Firestore);
