'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, ShoppingBag, AlertCircle, Check, Search, ArrowUpDown, ChevronRight, Minus, Plus } from 'lucide-react'
import ProductImage from "@/components/ProductImage" 

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  product: any
  onConfirm: (data: any) => void
}

export default function OrderModal({ isOpen, onClose, product, onConfirm }: OrderModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Modal açıkken arka plan kaymasını engelle
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  const suppliers = useMemo(() => {
    if (!product?.fiyatDetaylari) return []
    return product.fiyatDetaylari
      .map((f: any) => ({
        ...f,
        supplier_id: f.supplier_id || f.raw_mapping?.supplier_id,
        part_code: f.part_code || f.supplier_part_number,
        price: Number(f.price) || 0
      }))
      .sort((a: any, b: any) => a.price - b.price)
  }, [product])

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s: any) => 
      s.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.part_code.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [suppliers, searchTerm])

  useEffect(() => {
    if (isOpen && suppliers.length > 0) {
      setQuantity(1)
      setSearchTerm('')
      setSelectedSupplier(suppliers[0])
    }
  }, [isOpen, suppliers])

  if (!isOpen || !product) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-200">
      
      <div className="bg-white rounded-[1.5rem] w-full max-w-xl flex flex-col h-full max-h-[85vh] sm:max-h-[90dvh] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in duration-300">
        
        {/* --- 1. HEADER SEKSİYONU --- */}
        <div className="px-5 py-4 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div className="flex gap-4 min-w-0 flex-1">
              {/* ÜRÜN GÖRSELİ */}
            <div className="w-12 h-12 min-w-[48px] min-h-[48px] bg-slate-50 rounded-lg border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center group relative">
              <div className="w-10 h-10 flex items-center justify-center"> {/* İç kısıtlayıcı div */}
                <ProductImage 
                  src={product.image_url || "/placeholder.png"} 
                  alt={product.product_name} 
                  /* className yerine doğrudan genişliği kısıtlayan bir yapı */
                  className="max-w-full max-h-full object-contain transform group-hover:scale-110 transition-transform duration-500" 
                />
              </div>
            </div>

              {/* ÜRÜN BİLGİLERİ */}
              <div className="min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-wider border border-blue-100">
                    {product.stock_code}
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-black text-slate-800 leading-tight uppercase line-clamp-2 italic">
                  {product.product_name}
                </h2>
              </div>
            </div>

            {/* KAPATMA BUTONU */}
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 shrink-0">
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* ARAMA ÇUBUĞU */}
          <div className="relative group">
            <input 
              type="text"
              placeholder={`${suppliers.length} tedarikçi arasında ara...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-blue-500 outline-none transition-all shadow-inner placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* --- 2. TEDARİKÇİ LİSTESİ --- */}
        <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar bg-slate-50/40">
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1 mb-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Teklifler</label>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                En İyi Fiyat İlk Sırada
              </div>
            </div>

            {filteredSuppliers.map((f: any, i: number) => {
              const isSelected = selectedSupplier?.supplier_id === f.supplier_id && 
                               selectedSupplier?.part_code === f.part_code;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedSupplier(f)}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 transition-all relative group overflow-hidden ${
                    isSelected 
                    ? 'border-blue-600 bg-white shadow-xl shadow-blue-100 ring-1 ring-blue-600 z-10' 
                    : 'border-white bg-white/80 hover:border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-center relative z-10">
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`font-black text-xs uppercase truncate ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                          {f.company_name}
                        </span>
                        {isSelected && <Check className="text-blue-600 shrink-0" size={14} strokeWidth={4} />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded leading-none italic uppercase">
                          {f.part_code}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-base font-black tracking-tight ${isSelected ? 'text-blue-700' : 'text-emerald-600'}`}>
                        ₺{f.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </div>
                      {i === 0 && !searchTerm && (
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter block mt-0.5">Lider Fiyat</span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}

            {filteredSuppliers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-100">
                <AlertCircle size={32} className="mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">Sonuç Bulunamadı</p>
              </div>
            )}
          </div>
        </div>

        {/* --- 3. FOOTER (İŞLEM ALANI) --- */}
        <div className="px-5 py-5 border-t border-slate-100 bg-white shrink-0 shadow-[0_-12px_24px_-10px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Adet Seçici */}
            <div className="flex items-center bg-slate-50 rounded-2xl border-2 border-slate-100 overflow-hidden sm:w-40 h-12 shadow-inner">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 h-full hover:bg-white text-slate-400 hover:text-red-500 transition-colors active:scale-90"
              >
                <Minus size={16} strokeWidth={3} />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full bg-transparent border-none font-black text-slate-800 text-center text-base outline-none focus:ring-0 p-0"
              />
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 h-full hover:bg-white text-slate-400 hover:text-emerald-500 transition-colors active:scale-90"
              >
                <Plus size={16} strokeWidth={3} />
              </button>
            </div>
            
            {/* Sepet Butonu */}
            <button
              onClick={() => onConfirm({ product, quantity, selectedSupplier })}
              disabled={!selectedSupplier}
              className="flex-1 h-12 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-40 disabled:grayscale"
            >
              <ShoppingBag size={18} />
              <span>Sepete Ekle</span>
              <span className="w-px h-4 bg-white/20" />
              <span className="text-base tracking-tighter">
                ₺{(quantity * (selectedSupplier?.price || 0)).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  )
}