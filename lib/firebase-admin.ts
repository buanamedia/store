import * as admin from "firebase-admin";

function getFirebaseAdmin() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.warn("Firebase Admin: Environment variables missing during build step.");
      return null;
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
    } catch (error) {
      console.error("Firebase Admin initialization error:", error);
    }
  }
  return admin;
}

export const db = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop) {
    const adminApp = getFirebaseAdmin();
    if (!adminApp) {
      throw new Error("Firebase Admin SDK belum terkonfigurasi di Environment Variables.");
    }
    return (adminApp.firestore() as any)[prop];
  },
});

export const auth = new Proxy({} as admin.auth.Auth, {
  get(_target, prop) {
    const adminApp = getFirebaseAdmin();
    if (!adminApp) {
      throw new Error("Firebase Admin SDK belum terkonfigurasi di Environment Variables.");
    }
    return (adminApp.auth() as any)[prop];
  },
});
