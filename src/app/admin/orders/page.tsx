'use client'

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import PageHeader from "@/components/PageHeader"
import { Clock, Printer, Trash2, Save, Edit3, X, RefreshCw, AlertTriangle, Undo2, Loader2 } from "lucide-react"
import ProductImage from "@/components/ProductImage"

// Interface tanımlamaları aynı kalıyor...
interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  supplier_part_number?: string;
  isPendingDelete: boolean;
  order_id: string;
  products?: {
    product_name: string;
    stock_code: string;
    image_url: string;
  };
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  suppliers?: {
    company_name: string;
  };
  purchase_order_items: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [editBuffer, setEditBuffer] = useState<Order | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const { data: mainOrders, error: orderError } = await supabase
        .from('purchase_orders')
        .select(`*, suppliers (company_name)`)
        .order('created_at', { ascending: false })

      if (orderError) throw orderError
      if (!mainOrders) return

      const orderIds = mainOrders.map(o => o.id)
      const { data: allItems, error: itemsError } = await supabase
        .from('purchase_order_items')
        .select(`*, products!purchase_order_items_product_id_fkey (product_name, stock_code, image_url)`)
        .in('order_id', orderIds)

      if (itemsError) throw itemsError
      
      const ordersWithItems = mainOrders.map((order: any) => ({
        ...order,
        purchase_order_items: (allItems ?? [])
          .filter(item => item.order_id === order.id)
          .map(item => ({ ...item, isPendingDelete: false }))
      }))

      setOrders(ordersWithItems)
    } catch (err: any) {
      console.error("Veri çekme hatası:", err.message)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const startEditing = (order: Order) => {
    setEditingOrderId(order.id)
    setEditBuffer(JSON.parse(JSON.stringify(order)))
  }

  const cancelEditing = () => {
    setEditingOrderId(null)
    setEditBuffer(null)
  }

  const updateBufferTotal = (items: OrderItem[]) => {
    const newTotal = items
      .filter(i => !i.isPendingDelete)
      .reduce((sum, i) => sum + (Number(i.unit_price) * Number(i.quantity)), 0)
    
    setEditBuffer((prev) => prev ? ({ 
      ...prev, 
      purchase_order_items: items, 
      total_amount: newTotal 
    }) : null)
  }

  const handleQuantityChange = (itemId: string, val: string) => {
    if (!editBuffer) return
    const numVal = Math.max(0, parseInt(val) || 0)
    const updatedItems = editBuffer.purchase_order_items.map((item) => 
      item.id === itemId ? { ...item, quantity: numVal } : item
    )
    updateBufferTotal(updatedItems)
  }

  const toggleItemDelete = (itemId: string) => {
    if (!editBuffer) return
    const updatedItems = editBuffer.purchase_order_items.map((item) => 
      item.id === itemId ? { ...item, isPendingDelete: !item.isPendingDelete } : item
    )
    updateBufferTotal(updatedItems)
  }

  const saveChanges = async () => {
    if (!editBuffer || actionLoading) return
    setActionLoading(true)
    try {
      const toDelete = editBuffer.purchase_order_items.filter((i) => i.isPendingDelete).map((i) => i.id)
      const toUpdate = editBuffer.purchase_order_items.filter((i) => !i.isPendingDelete)
      if (toDelete.length > 0) {
        await supabase.from('purchase_order_items').delete().in('id', toDelete)
      }
      const updatePromises = toUpdate.map((item) => 
        supabase.from('purchase_order_items').update({ quantity: item.quantity }).eq('id', item.id)
      )
      await Promise.all(updatePromises)
      const { error: finalError } = await supabase
        .from('purchase_orders')
        .update({ total_amount: editBuffer.total_amount })
        .eq('id', editBuffer.id)
      if (finalError) throw finalError
      await fetchOrders()
      cancelEditing()
    } catch (err: any) {
      alert("Hata: " + err.message)
    } finally { setActionLoading(false) }
  }

  const deleteOrder = async (id: string) => {
    if (!confirm("Bu siparişi tamamen silmek istediğinize emin misiniz?")) return
    const { error } = await supabase.from('purchase_orders').delete().eq('id', id)
    if (!error) setOrders(prev => prev.filter(o => o.id !== id))
  }

  const handlePrint = (orderId: string) => {
    const printContent = document.getElementById(`order-${orderId}`);
    if (!printContent) return;
    document.body.classList.add('printing-single-order');
    printContent.classList.add('printable-order');
    window.print();
    document.body.classList.remove('printing-single-order');
    printContent.classList.remove('printable-order');
  };

  if (loading && orders.length === 0) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
  }

  return (
    <div className="p-2 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-8 animate-in fade-in duration-500">
      <div className="print:hidden flex justify-between items-center px-2">
        <PageHeader title="Sipariş Yönetimi" count={orders.length} />
        <button 
          disabled={loading}
          onClick={fetchOrders} 
          className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all disabled:opacity-50"
        >
          <RefreshCw className={loading ? "animate-spin" : ""} size={22}/>
        </button>
      </div>

      <div className="space-y-6 md:space-y-12">
        {orders.map((order) => {
          const isEditing = editingOrderId === order.id
          const displayData = isEditing ? editBuffer : order
          if (!displayData) return null

          return (
            <div key={order.id} id={`order-${order.id}`} className={`bg-white rounded-[1.5rem] md:rounded-[2.5rem] border transition-all duration-500 ${isEditing ? 'border-blue-500 ring-4 md:ring-8 ring-blue-50 shadow-2xl scale-[1.01]' : 'border-slate-100 shadow-sm'} overflow-hidden print:shadow-none print:border-none print:ring-0 print:rounded-none`}>
              
              {/* HEADER */}
              <div className="px-5 py-4 md:px-8 md:py-6 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:bg-transparent print:px-0 print:flex-row">
                <div>
                  <h3 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Memonex Tedarik Formu</h3>
                  <p className="text-lg md:text-xl font-black text-slate-900 uppercase italic leading-none">{displayData.suppliers?.company_name}</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto print:hidden">
                  {isEditing ? (
                    <div className="flex gap-2 w-full">
                      <button disabled={actionLoading} onClick={saveChanges} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-green-100">
                        {actionLoading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Kaydet
                      </button>
                      <button disabled={actionLoading} onClick={cancelEditing} className="flex-1 md:flex-none bg-white border-2 border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase">
                        Vazgeç
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full md:w-auto gap-2">
                      <button onClick={() => startEditing(order)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-xl shadow-slate-200">
                        <Edit3 size={14} /> Düzenle
                      </button>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handlePrint(order.id)} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-xl transition-all">
                          <Printer size={18} />
                        </button>
                        <button onClick={() => deleteOrder(order.id)} className="p-2.5 text-slate-300 hover:text-red-600 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="hidden md:table-header-group print:table-header-group">
                    <tr className="border-b border-slate-100">
                      <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 print:px-0">Ürün / Tedarikçi Kodu</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 text-center w-48 print:text-right print:px-0">Miktar</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 text-right w-32 print:hidden">Birim Fiyat</th>
                      {isEditing && <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 text-right w-24">Aksiyon</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 print:divide-slate-200">
                    {displayData.purchase_order_items?.map((item) => (
                      <tr key={item.id} className={`flex flex-col md:table-row p-4 md:p-0 print:table-row transition-all ${item.isPendingDelete ? 'opacity-40' : ''} print:opacity-100`}>
                        <td className="md:px-8 md:py-5 print:table-cell print:px-0 print:py-3">
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-100 rounded-lg md:rounded-xl overflow-hidden flex-shrink-0 border border-slate-200 print:w-14 print:h-14">
                              <ProductImage src={item.products?.image_url || ""} alt={item.products?.product_name || "Ürün"} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="text-lg md:text-[20px] font-black text-blue-600 tracking-tighter uppercase leading-none mb-1 print:text-slate-900">
                                {item.supplier_part_number || item.products?.stock_code}
                              </p>
                              <p className="font-bold text-slate-500 md:text-slate-800 text-[10px] md:text-sm uppercase leading-tight print:hidden">
                                {item.products?.product_name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="md:px-8 md:py-5 mt-3 md:mt-0 print:table-cell print:px-0 print:py-3">
                          <div className="flex items-center justify-between md:justify-center print:justify-end">
                            <span className="md:hidden text-[10px] font-black text-slate-400 uppercase print:hidden">Miktar:</span>
                            {isEditing ? (
                              <input 
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                className="w-20 md:w-24 px-2 py-1.5 text-center font-black text-slate-900 border-2 border-slate-200 rounded-lg text-sm"
                              />
                            ) : (
                              <span className="font-black text-slate-900 bg-slate-100 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs print:bg-transparent print:p-0 print:text-sm">
                                {item.quantity} ADET
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="md:px-8 md:py-5 mt-2 md:mt-0 text-right print:hidden">
                           <div className="flex items-center justify-between md:justify-end">
                              <span className="md:hidden text-[10px] font-black text-slate-400 uppercase">Birim Fiyat:</span>
                              <span className="font-bold text-slate-500 text-xs md:text-sm italic">₺{Number(item.unit_price).toLocaleString('tr-TR')}</span>
                           </div>
                        </td>
                        {isEditing && (
                          <td className="md:px-8 md:py-5 mt-3 md:mt-0 text-right print:hidden">
                            <button onClick={() => toggleItemDelete(item.id)} className={`w-full md:w-auto flex items-center justify-center gap-2 py-2 md:p-2 rounded-lg border md:border-none ${item.isPendingDelete ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-red-50 text-red-600 border-red-200'} md:bg-transparent`}>
                              {item.isPendingDelete ? <Undo2 size={18} /> : <Trash2 size={18} />}
                              <span className="md:hidden text-[10px] font-black uppercase">{item.isPendingDelete ? 'Geri Al' : 'Sil'}</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* FOOTER */}
              <div className={`px-5 py-4 md:px-8 md:py-6 border-t flex flex-col md:flex-row justify-between items-center gap-4 ${isEditing ? 'bg-blue-50/50' : 'bg-slate-50/30'} print:bg-transparent print:px-0 print:py-4 print:mt-4 print:flex-row`}>
                <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold text-slate-400 italic uppercase print:text-slate-900">
                  <Clock size={12} className="print:hidden"/> Sipariş: {new Date(order.created_at).toLocaleDateString('tr-TR')}
                </div>
                <div className="text-center md:text-right w-full md:w-auto print:hidden">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Genel Toplam</p>
                  <p className={`font-black italic ${isEditing ? 'text-2xl md:text-3xl text-blue-600' : 'text-xl md:text-2xl text-slate-900'}`}>
                    ₺{Number(displayData.total_amount).toLocaleString("tr-TR")}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}