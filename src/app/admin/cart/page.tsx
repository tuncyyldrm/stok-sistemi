'use client'
export const dynamic = 'force-dynamic';
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Trash2, ShoppingCart, Loader2, CheckCircle2 } from 'lucide-react'
import ProductImage from "@/components/ProductImage"

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (product_name, image_url),
        suppliers (company_name)
      `)
    
    if (!error) setCartItems(data || [])
    setLoading(false)
  }

  const updateQuantity = async (id: number, newQuantity: number) => {
    const qty = Math.max(1, newQuantity);
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: qty } : item));
    await supabase.from('cart_items').update({ quantity: qty }).eq('id', id);
  }

  const groupedCart = useMemo(() => {
    return cartItems.reduce((acc: any, item: any) => {
      const supplierName = item.suppliers?.company_name || 'Bilinmeyen Tedarikçi'
      if (!acc[supplierName]) acc[supplierName] = {}
      const uniqueKey = `${item.product_id}_${item.supplier_part_number}`
      
      if (!acc[supplierName][uniqueKey]) {
        acc[supplierName][uniqueKey] = { ...item }
      } else {
        acc[supplierName][uniqueKey].quantity += item.quantity
      }
      return acc
    }, {})
  }, [cartItems])

  const calculateSupplierTotal = (items: any) => {
    return Object.values(items).reduce((acc: number, item: any) => acc + (item.unit_price * item.quantity), 0);
  };

  const grandTotal = Object.values(groupedCart).reduce((acc: number, supplierItems: any) => acc + calculateSupplierTotal(supplierItems), 0);

  const deleteItem = async (uniqueKey: string, supplierName: string) => {
    const itemToDelete = groupedCart[supplierName][uniqueKey]
    setCartItems(prev => prev.filter(i => !(i.product_id === itemToDelete.product_id && i.supplier_part_number === itemToDelete.supplier_part_number)));
    await supabase.from('cart_items').delete().eq('product_id', itemToDelete.product_id).eq('supplier_part_number', itemToDelete.supplier_part_number)
  }

  const handleCompleteOrder = async (supplierId: string, supplierName: string) => {
    setProcessingId(supplierId)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert("Oturum açmanız gerekiyor!"); setProcessingId(null); return; }

    const { error } = await supabase.rpc('create_purchase_order', { p_user_id: user.id, p_supplier_id: supplierId })
    if (error) { alert("Sipariş oluşturulamadı: " + error.message); }
    else { alert(`${supplierName} siparişiniz başarıyla alındı!`); fetchCart(); }
    setProcessingId(null)
  }

  if (loading) return <div className="p-8 text-center flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex items-center gap-3 mb-8">
        <ShoppingCart className="text-blue-600" size={32} />
        <h1 className="text-3xl font-bold">Sepetim</h1>
      </div>

      {Object.entries(groupedCart).length === 0 ? (
        <div className="text-center p-12 bg-white rounded-3xl border border-slate-100">Sepetiniz şu an boş.</div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedCart)
            .sort((a: any, b: any) => a[0].localeCompare(b[0]))
            .map(([supplierName, productsObj]: [string, any]) => {
              const firstItem = (Object.values(productsObj)[0] as any) || null
              const supplierId = firstItem?.supplier_id ?? null
              return (
                <section key={supplierName} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <h2 className="text-lg font-black text-blue-600 mb-4 uppercase tracking-wider">{supplierName}</h2>
                  <div className="space-y-4">
                    {Object.entries(productsObj).map(([uniqueKey, item]: [string, any]) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                        {/* Sabit boyutlu resim alanı */}
                        <div className="w-20 h-20 flex-shrink-0">
                          <ProductImage src={item.products?.image_url} alt={item.products?.product_name} className="w-10 h-10 object-cover rounded-xl bg-white border border-slate-100 shadow-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{item.products?.product_name}</p>
                          <p className="text-xs font-mono text-slate-400">Tedarikçi Kodu: {item.supplier_part_number}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <input 
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-16 px-2 py-1 border rounded-lg font-bold text-sm text-center"
                            />
                            <span className="text-sm text-slate-500 ml-2 whitespace-nowrap">₺{(item.unit_price * item.quantity).toLocaleString("tr-TR")}</span>
                          </div>
                        </div>
                        <button onClick={() => deleteItem(uniqueKey, supplierName)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg flex-shrink-0"><Trash2 size={18} /></button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-500">Ara Toplam:</span>
                    <span className="text-xl font-black">₺{calculateSupplierTotal(productsObj).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <button onClick={() => handleCompleteOrder(supplierId, supplierName)} disabled={processingId === supplierId} className="mt-4 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                    {processingId === supplierId ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> {supplierName} Siparişini Tamamla</>}
                  </button>
                </section>
              )
            })}
          
          <div className="bg-slate-900 text-white p-8 rounded-3xl flex justify-between items-center shadow-2xl">
            <p className="text-xl font-black">Genel Toplam</p>
            <p className="text-3xl font-black">₺{grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      )}
    </main>
  )
}