export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">STORE System</h1>
        <p className="mt-2 text-sm text-gray-600">
          Centralized Payment & Entitlement Engine Active.
        </p>
        <div className="mt-6 p-4 bg-blue-50 text-blue-700 text-xs rounded-lg text-left font-mono">
          Status: Ready<br />
          Gateway: DOKU Sandbox<br />
          Storage: Telegram
        </div>
      </div>
    </main>
  );
}
