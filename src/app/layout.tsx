// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 1. Keep the font and metadata for a professional dashboard experience
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Secure Device-Aware Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* 2. suppressHydrationWarning fixes your browser extension issue */}
      {/* 3. The class string combines your font with the design styles */}
      <body 
        suppressHydrationWarning={true} 
        className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}
      >
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}