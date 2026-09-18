"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Import Firebase secara dinamis di sisi Client agar Vercel tidak crash saat Build
      const { initializeApp, getApps } = await import("firebase/app");
      const { getAuth, signInWithEmailAndPassword } = await import("firebase/auth");

      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };

      const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
      const auth = getAuth(app);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();

      localStorage.setItem("admin_token", token);
      router.push("/admin");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError("Login gagal: " + err.message);
      } else {
        setError("Login gagal: Terjadi kesalahan.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) return null;

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "sans-serif", backgroundColor: "#f4f6f8" }}>
      <form onSubmit={handleLogin} style={{ background: "#fff", padding: "30px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", width: "100%", maxWidth: "400px" }}>
        <h2 style={{ marginBottom: "20px", textAlign: "center" }}>Admin Login</h2>
        {error && <div style={{ color: "red", marginBottom: "15px", fontSize: "14px" }}>{error}</div>}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>Email Admin</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: "10px", backgroundColor: "#0070f3", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
        >
          {loading ? "Memproses..." : "Login"}
        </button>
      </form>
    </div>
  );
}
