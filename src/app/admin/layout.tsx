'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { LayoutDashboard, Package, Truck, FileUp, Tags, CircleDollarSign, Menu, X } from "lucide-react"

const menu = [
  { name: "Anasayfa", href: "/", icon: LayoutDashboard },
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Sepetler", href: "/admin/cart", icon: Package },
  { name: "Siparişler", href: "/admin/orders", icon: FileUp },
  { name: "Tedarikçiler", href: "/admin/suppliers", icon: Truck },
  { name: "Eşleştirme", href: "/admin/import/mapping", icon: Tags },
  { name: "Fiyatlar", href: "/admin/import/prices", icon: CircleDollarSign },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Menü açıldığında sayfanın arkada kaymasını engeller
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <div className="flex min-h-screen bg-slate-50">
      
      {/* 1. MOBİL HEADER (Sadece Mobilde Görünür) */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b flex items-center justify-between px-4 z-[60]">
        <span className="font-black tracking-tighter text-xl text-slate-900">ADMIN</span>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
        >
          {isOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </header>

      {/* 2. SIDEBAR (Mobilde Kayar Panel, Masaüstünde Sabit) */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-72 bg-white border-r border-slate-200 
        transform transition-transform duration-300 ease-out
        md:sticky md:translate-x-0 md:z-30 md:h-screen
        ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
      `}>
        {/* Sidebar Logosu */}
        <div className="h-16 md:h-20 flex items-center px-8 border-b">
          <span className="font-black text-xl tracking-tighter text-blue-600">MEMONEX</span>
        </div>

        {/* Menü Linkleri */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-80px)]">
          {menu.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* 3. OVERLAY (Menü açıldığında arkayı karartır) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[65] md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 4. ANA İÇERİK ALANI */}
      <main className="flex-1 min-w-0 flex flex-col pt-16 md:pt-0">
        <div className="p-4 md:p-10 w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  )
}