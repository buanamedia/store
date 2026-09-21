export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          border: "1px solid #1e293b",
          backgroundColor: "#1e293b",
          borderRadius: "12px",
          padding: "32px",
          maxWidth: "480px",
          width: "100%",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div
          style={{
            display: "inline-block",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: "#22c55e",
            marginBottom: "16px",
          }}
        />
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            marginBottom: "8px",
            color: "#ffffff",
          }}
        >
          STORE Engine API
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "0.875rem", margin: 0 }}>
          Centralized Headless Payment & Digital License Core System
        </p>
        <div
          style={{
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid #334155",
            fontSize: "0.75rem",
            color: "#64748b",
          }}
        >
          Status: <span style={{ color: "#22c55e", fontWeight: "600" }}>Operational</span>
        </div>
      </div>
    </main>
  );
}
