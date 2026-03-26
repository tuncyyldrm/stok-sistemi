'use client'

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { LayoutDashboard, Home } from "lucide-react";
import { usePathname } from "next/navigation";

import { metadata } from "./metadata"; // sadece import

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/"; // Anasayfa mı?

  return (
    <html lang="tr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}>
        
        {/* Sabit Sağ Üst Navigasyon */}
        <nav className="fixed top-4 right-4 z-50 flex items-center gap-2">
          {isHome ? (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white/50 text-slate-400 rounded-xl shadow-lg border border-slate-200 backdrop-blur-md cursor-not-allowed select-none">
              <Home size={18} className="text-slate-400" strokeWidth={2.5} />
              <span className="font-bold text-sm tracking-tight">Anasayfa</span>
            </div>
          ) : (
            <Link href="/" className="flex items-center gap-2 px-4 py-2.5 bg-white/80 hover:bg-white text-slate-700 rounded-xl shadow-lg border border-slate-200 backdrop-blur-md transition-all active:scale-95">
              <Home size={18} className="text-slate-500" strokeWidth={2.5} />
              <span className="font-bold text-sm tracking-tight">Anasayfa</span>
            </Link>
          )}

          <Link href="/admin" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xl shadow-blue-200/50 transition-all active:scale-95">
            <LayoutDashboard size={18} strokeWidth={2.5} />
            <span className="font-bold text-sm tracking-tight">Yönetim</span>
          </Link>
        </nav>

        {/* Ana İçerik */}
        <main className="min-h-screen pt-24 px-4 md:px-8 max-w-[1400px] mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}