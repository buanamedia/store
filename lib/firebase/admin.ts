import * as admin from "firebase-admin";

export function getAdminDb() {
  if (!admin.apps.length) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Firebase Admin environment variables are missing.");
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  }
  return admin.firestore();
}

export function getAdminAuth() {
  if (!admin.apps.length) {
    getAdminDb(); // Trigger initializeApp jika belum ada
  }
  return admin.auth();
}
