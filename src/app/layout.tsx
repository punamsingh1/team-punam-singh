import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Setting up the professional Inter font (Standard in modern dashboards)
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: " Admin Dashboard",
  description: "Secure Device-Aware Management System",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        {/* The 'children' represents your pages (Login, Dashboard, etc.)
            By wrapping them here, we ensure consistent background 
            and font across the entire application.
        */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* If you add a global Footer or Notification system later, 
            it goes here to stay visible across all routes.
        */}
      </body>
    </html>
  );
}