import Link from "next/link"
import { Package, Tags, ArrowRight, ShoppingCart, BarChart3, Settings } from "lucide-react"

export default function AdminPage() {
  const cards = [
    { 
      title: "Envanter Yönetimi", 
      description: "Stok durumlarını ve ürün detaylarını inceleyin.",
      href: "/", // Burayı kendi path'ine göre güncelle
      icon: Package, 
      color: "from-slate-800 to-slate-950" 
    },
    { 
      title: "Fiyat Eşleme", 
      description: "Tedarikçi kodlarını sistem ürünleriyle bağlayın.",
      href: "/admin/import/mapping", 
      icon: Tags, 
      color: "from-blue-600 to-blue-700" 
    },
    { 
      title: "Siparişler", 
      description: "Bekleyen ve tamamlanan siparişleri yönetin.",
      href: "/admin/orders", 
      icon: ShoppingCart, 
      color: "from-emerald-600 to-emerald-700" 
    },
    { 
      title: "Analizler", 
      description: "Satış verilerini ve fiyat değişimlerini görün.",
      href: "/admin/", 
      icon: BarChart3, 
      color: "from-orange-500 to-orange-600" 
    }
  ]

return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:p-6">
      <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 md:text-left text-center tracking-tight">
        Yönetim Paneli
      </h1>
      
      {/* Mobilde 1, Tablet/Masaüstü 2 kolon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
        {cards.map((card) => (
          <Link 
            key={card.href}
            href={card.href}
            className={`
              relative bg-gradient-to-br ${card.color} 
              p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] 
              text-white group hover:scale-[1.01] active:scale-95 transition-all duration-300 
              flex flex-col justify-between min-h-[220px] md:min-h-[280px] 
              shadow-xl shadow-slate-200 overflow-hidden
            `}
          >
            {/* Arka Plan Dekoratif İkon - Mobilde biraz daha küçük */}
            <card.icon 
              className="absolute -top-6 -right-6 md:-top-10 md:-right-10 opacity-10 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-500 size-[120px] md:size-[180px]" 
            />

            <div className="relative z-10">
              <div className="bg-white/10 w-fit p-3 md:p-4 rounded-2xl backdrop-blur-md mb-4 md:mb-6">
                <card.icon size={28} className="md:size-8" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black mb-1 md:mb-2">{card.title}</h2>
              <p className="text-white/70 text-sm md:text-base font-medium max-w-[200px] md:max-w-[250px]">
                {card.description}
              </p>
            </div>

            <div className="relative z-10 flex justify-end">
              <div className="bg-white/20 p-3 md:p-4 rounded-full group-hover:bg-white group-hover:text-slate-900 transition-all duration-300">
                <ArrowRight size={20} className="md:size-6 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}