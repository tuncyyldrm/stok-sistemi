'use client'

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import ProductImage from "@/components/ProductImage"
import GlobalActionModal from "@/components/GlobalActionModal"
import OrderModal from "@/components/OrderModal"
import { Package, Plus, ChevronLeft, ChevronRight, LayoutGrid, ShoppingBag } from "lucide-react"
import PageHeader from "@/components/PageHeader";

// Skeleton Bileşeni
const ProductSkeleton = () => (
  <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 animate-pulse mb-6">
    <div className="flex flex-col lg:flex-row gap-10">
      <div className="w-full lg:w-[280px] aspect-square bg-slate-100 rounded-[2rem]" />
      <div className="flex-1 space-y-6 py-2">
        <div className="h-8 bg-slate-100 rounded-xl w-3/4" />
        <div className="h-4 bg-slate-50 rounded-lg w-1/4" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-slate-50 rounded-2xl" />
          <div className="h-20 bg-slate-50 rounded-2xl" />
        </div>
      </div>
    </div>
  </div>
)

export default function InventoryPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const queryPage = Number(searchParams.get("page")) || 1
  const querySearch = searchParams.get("search") || ""

  const [products, setProducts] = useState<any[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState(querySearch)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalData, setModalData] = useState<any>(null)
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<any>(null);
  const [totalCount, setTotalCount] = useState(0); // Yeni state

  const pageSize = 50

  const updateUrl = useCallback((newPage: number, newSearch: string) => {
    const params = new URLSearchParams()
    if (newPage > 1) params.set("page", newPage.toString())
    if (newSearch) params.set("search", newSearch)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [pathname, router])

const loadProducts = useCallback(async (initial = true) => {
  initial ? setLoading(true) : setIsRefreshing(true);

  try {
    // 1. Sayfalama Sınırlarını Belirle
    let from = (queryPage - 1) * pageSize;
    let to = from + pageSize - 1;

    // --- KRİTİK DÜZELTME: TOPLAM ÜRÜN SAYISI ---
    // Eğer arama terimi yoksa, doğrudan 'products' tablosundan net sayıyı alıyoruz.
    if (!querySearch || querySearch.trim().length === 0) {
      const { count: realProductCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });
      
      setTotalCount(realProductCount || 0);
      setTotalPages(Math.ceil((realProductCount || 0) / pageSize));
    }
    
    // 2. Temel Sorgu (View üzerinden arama ve eşleşmeler için)
    let query = supabase
      .from("product_search_view")
      .select("*", { count: "exact" });

    // --- HİBRİT VE ÖBEK KORUMALI TERS ARAMA ---
    if (querySearch && querySearch.trim().length > 0) {
      const cleanTerm = querySearch.trim().toLowerCase();

      const normalize = (text: string): string =>
        text
          .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
          .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c");

      const regex: RegExp = /"([^"]+)"|(\S+)/g;
      let match: RegExpExecArray | null;
      const searchUnits: string[] = [];

      while ((match = regex.exec(cleanTerm)) !== null) {
        searchUnits.push(match[1] || match[2]);
      }

      if (searchUnits.length > 0) {
        searchUnits.forEach((unit: string) => {
          const nu = normalize(unit);
          const unitCondition: string = [
            `product_name.ilike.%${unit}%`,
            `product_name.ilike.%${nu}%`,
            `stock_code.ilike.%${unit}%`,
            `supplier_part_number.ilike.%${unit}%`,
          ].join(",");

          query = query.or(unitCondition);
        });
      }
    }

    // 3. Veriyi Çek
    const { data: viewData, count, error: fetchError } = await query
      .order("stock_code", { ascending: true })
      .range(from, to);

    if (fetchError) {
      if (fetchError.message.includes("Requested range not satisfiable") || fetchError.code === "PGRST103") {
        updateUrl(1, querySearch);
        return;
      }
      throw fetchError;
    }

    // 4. Veriyi Grupla (Ürün bazlı birleştirme)
    const urunMap = new Map();
    viewData?.forEach((item: any) => {
      if (!urunMap.has(item.id)) {
        urunMap.set(item.id, {
          id: item.id,
          product_name: item.product_name,
          stock_code: item.stock_code,
          image_url: item.image_url,
          product_mappings: [],
        });
      }

      if (item.supplier_id) {
        urunMap.get(item.id).product_mappings.push({
          id: item.mapping_id,
          supplier_id: item.supplier_id,
          supplier_part_number: item.supplier_part_number,
          suppliers: { company_name: item.company_name },
          raw_mapping: {
            id: item.mapping_id,
            supplier_id: item.supplier_id,
            supplier_part_number: item.supplier_part_number,
          },
        });
      }
    });

    const urunler = Array.from(urunMap.values());

    // --- ARAMA VARSA SAYIYI GÜNCELLE ---
    if (querySearch && querySearch.trim().length > 0) {
      // Arama sonuçlarında mecburen view count'u kullanılır (yaklaşık değerdir)
      // Ancak sonuç o anki sayfadan azsa gerçek array uzunluğunu set ederiz.
      const displayCount = (count || 0);
      setTotalCount(displayCount);
      setTotalPages(Math.ceil(displayCount / pageSize));
    }

    // 5. Fiyatları Çek
    const supplierIds = urunler.flatMap((p) => p.product_mappings.map((m: any) => m.supplier_id));
    const partNumbers = urunler.flatMap((p) => p.product_mappings.map((m: any) => m.supplier_part_number));

    let fiyatMap = new Map();
    if (supplierIds.length > 0) {
      const { data: fiyatlar } = await supabase
        .from("supplier_raw_prices")
        .select("supplier_id,part_number,discounted_price,list_price")
        .in("supplier_id", supplierIds)
        .in("part_number", partNumbers);

      fiyatlar?.forEach((f: any) =>
        fiyatMap.set(`${f.supplier_id}_${String(f.part_number).trim().toLowerCase()}`, f)
      );
    }

    // 6. Final Formatlama
    const finalProducts = urunler.map((urun) => {
      const fiyatDetaylari = urun.product_mappings.map((map: any) => {
        const key = `${map.supplier_id}_${String(map.supplier_part_number).trim().toLowerCase()}`;
        const f = fiyatMap.get(key);
        const price = f ? (Number(f.discounted_price) > 0 ? Number(f.discounted_price) : Number(f.list_price || 0)) : 0;

        return {
          company_name: map.suppliers.company_name,
          part_code: map.supplier_part_number,
          price: price,
          supplier_id: map.supplier_id,
          raw_mapping: map.raw_mapping,
        };
      });
      return { ...urun, fiyatDetaylari };
    });

    setProducts(finalProducts);

  } catch (err: any) {
    console.error("Envanter Yükleme Hatası:", err.message);
  } finally {
    setLoading(false);
    setIsRefreshing(false);
  }
}, [queryPage, querySearch]);
// 1. Fonksiyonu Tanımlayın
const handleAddToCart = async (data: any) => {
  const { product, quantity, selectedSupplier } = data;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert("Lütfen önce giriş yapın.");
      return;
    }

    // 1. Önce bu ürün sepette bu kullanıcı ve bu tedarikçi koduyla var mı bak
    const { data: existingItem, error: fetchError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .eq('supplier_part_number', selectedSupplier.part_code)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existingItem) {
      // 2. Ürün varsa: Mevcut miktarın üzerine yeni miktarı ekle (UPDATE)
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ 
          quantity: existingItem.quantity + quantity,
          unit_price: selectedSupplier.price // Fiyat güncellenmiş olabilir
        })
        .eq('id', existingItem.id);

      if (updateError) throw updateError;
    } else {
      // 3. Ürün yoksa: Yeni satır oluştur (INSERT)
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: product.id,
          supplier_id: selectedSupplier.supplier_id,
          quantity: quantity,
          unit_price: selectedSupplier.price,
          supplier_part_number: selectedSupplier.part_code
        });

      if (insertError) throw insertError;
    }

    // Başarılı işlemlerden sonra
    setOrderModalOpen(false);
    alert("Sepet güncellendi!");

  } catch (err: any) {
    console.error("Sepet Hatası:", err.message);
    alert("İşlem sırasında bir hata oluştu: " + err.message);
  }
};


// 1. Sadece URL'i güncelleyen useEffect (Debounce ile)
useEffect(() => {
  const delay = setTimeout(() => {
    if (searchTerm !== querySearch) {
      updateUrl(1, searchTerm); // ⚠️ page reset burada
    }
  }, 400);

  return () => clearTimeout(delay);
}, [searchTerm, querySearch, updateUrl]);

// 2. VERİ ÇEKME - Sadece URL parametreleri değişince çalışmalı!
// Bağımlılıklardan 'page' ve 'searchTerm' state'lerini ÇIKARDIK.
useEffect(() => {
  loadProducts(true);
}, [queryPage, querySearch, loadProducts]);

  return (
    <div className="animate-in fade-in duration-500">

      <PageHeader 
        title="Envanter Paneli" 
        count={totalCount} 
        searchTerm={searchTerm} 
        setSearchTerm={(val) => {
          setSearchTerm(val);
        }} 
        placeholder="Model veya stok kodu ile ara..."
      />

      <div className={`grid grid-cols-1 gap-8 transition-opacity duration-300 ${isRefreshing ? 'opacity-40' : 'opacity-100'}`}>
        {loading ? (
          Array(3).fill(0).map((_, i) => <ProductSkeleton key={i} />)
        ) : (
          products.map((urun) => {
            const prices = urun.fiyatDetaylari.map((f: any) => f.price).filter((p: number) => p > 0);
            const cheapest = prices.length > 0 ? Math.min(...prices) : null;
            const avgPrice = prices.length > 0 
              ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length 
              : 0;
            
            return (
              <section key={urun.id} className="group bg-white rounded-[3rem] p-6 lg:p-10 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500">
                <div className="flex flex-col lg:flex-row gap-12">
                  
                  {/* Sol: Görsel ve Fiyat Özetleri */}
                  <div className="w-full lg:w-[300px] shrink-0 space-y-6">
                    <div className="relative aspect-square rounded-[2.5rem] overflow-hidden border border-slate-100 bg-slate-50">
                      <ProductImage 
                        src={urun.image_url} 
                        alt={urun.product_name} 
                        className="object-contain w-full h-full p-6 mix-blend-multiply group-hover:scale-110 transition-transform duration-700" 
                      />
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 shadow-sm font-mono font-black text-xs">
                        {urun.stock_code}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-[1.5rem] text-center">
                        <p className="text-[10px] text-emerald-600 font-black uppercase mb-1">En Uygun</p>
                        <p className="text-xl font-black text-emerald-700">₺{cheapest?.toLocaleString("tr-TR") || "---"}</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-4 rounded-[1.5rem] text-center">
                        <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Ortalama</p>
                        <p className="text-xl font-black text-slate-700">₺{avgPrice.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</p>
                      </div>
                    </div>
                  </div>

                  {/* Orta ve Sağ: Bilgiler ve Tedarikçi Listesi */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1.5 rounded-xl border border-blue-100 flex items-center gap-2">
                          <Package size={14} /> {urun.fiyatDetaylari.length} TEDARİKÇİ BAĞLI
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        <span className="text-emerald-500 text-[10px] font-black tracking-widest uppercase">Stokta Mevcut</span>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 leading-tight mb-8 group-hover:text-blue-600 transition-colors">
                        {urun.product_name}
                      </h2>

                      {/* Tedarikçi Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                        {urun.fiyatDetaylari.map((f: any, i: number) => (
                          <div 
                            key={i} 
                            onClick={() => { setModalData({ ...urun, mapping: f.raw_mapping }); setModalOpen(true); }}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${f.price === cheapest ? 'bg-emerald-50/30 border-emerald-200 ring-1 ring-emerald-100' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-md'}`}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate uppercase">{f.company_name}</p>
                              <p className="text-[10px] text-slate-400 font-mono italic">{f.part_code}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-black ${f.price === cheapest ? 'text-emerald-600' : 'text-slate-700'}`}>₺{f.price.toLocaleString("tr-TR")}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Aksiyon Butonları */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                      <button 
                        onClick={() => { setActiveProduct(urun); setOrderModalOpen(true); }} 
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-blue-200 transition-all active:scale-95"
                      >
                        <ShoppingBag size={20} /> SİPARİŞ OLUŞTUR
                      </button>
                      <button 
                        onClick={() => { setModalData(urun); setModalOpen(true); }}
                        className="px-8 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[11px] font-black uppercase text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={18} /> Tedarikçi Ekle
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <footer className="flex flex-col md:flex-row justify-between items-center mt-16 mb-10 gap-6">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-400 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
          <LayoutGrid size={18} className="text-blue-600" />
          SAYFA {queryPage} / {totalPages}
        </div>
        
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <button 
            onClick={() => { updateUrl(Math.max(1, queryPage - 1), querySearch); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={queryPage <= 1}
            className="p-3 rounded-xl hover:bg-slate-50 disabled:opacity-20 transition-all text-slate-600"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="flex gap-1 px-2">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pNum = queryPage <= 3 ? i + 1 : queryPage + i - 2;
              if (pNum > totalPages) return null;
              return (
                <button
                  key={pNum}
                  onClick={() => { updateUrl(pNum, querySearch); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`w-12 h-12 rounded-xl font-black text-sm transition-all ${queryPage === pNum ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  {pNum}
                </button>
              )
            })}
          </div>

          <button 
            onClick={() => { updateUrl(Math.min(totalPages, queryPage + 1), querySearch); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={queryPage >= totalPages}
            className="p-3 rounded-xl hover:bg-slate-50 disabled:opacity-20 transition-all text-slate-600"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </footer>

{/* Modallar */}
<OrderModal 
  isOpen={orderModalOpen} 
  onClose={() => setOrderModalOpen(false)}
  product={activeProduct}
  // BURAYI GÜNCELLEDİK: handleAddToCart fonksiyonunu buraya geçiyoruz
  onConfirm={handleAddToCart} 
/>
      <GlobalActionModal 
        isOpen={modalOpen} 
        onClose={() => { setModalOpen(false); loadProducts(false) }} 
        data={modalData} 
      />
    </div>
    
  )
}