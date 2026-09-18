import { adminAuth } from "@/lib/firebase/admin";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  isAdmin: boolean;
}

export async function verifyAuthToken(req: Request): Promise<AuthenticatedUser> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED: Header Authorization tidak ditemukan.");
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const isAdmin = decodedToken.admin === true || decodedToken.role === "admin";

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      isAdmin,
    };
  } catch (error) {
    throw new Error("UNAUTHORIZED: Token tidak valid atau kedaluwarsa.");
  }
}
