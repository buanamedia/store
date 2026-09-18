import React from "react";
import "./globals.css";

export const metadata = {
  title: "STORE System",
  description: "Centralized Software Access & Payment System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-gray-50 text-gray-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
