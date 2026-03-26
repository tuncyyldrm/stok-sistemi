'use server'

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function createOrdersFromCart(userId: string) {
  try {
    // 1. Sepetteki ürünleri getir
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)

    if (cartError || !cartItems || cartItems.length === 0) {
      throw new Error("Sepetiniz boş veya bir hata oluştu.")
    }

    // 2. Ürünleri tedarikçi bazlı grupla (Supplier ID'ye göre)
    const groupedBySupplier = cartItems.reduce((acc: any, item: any) => {
      if (!acc[item.supplier_id]) acc[item.supplier_id] = []
      acc[item.supplier_id].push(item)
      return acc
    }, {})

    // 3. Her tedarikçi için bir ana sipariş ve alt kalemlerini oluştur
    for (const supplierId in groupedBySupplier) {
      const items = groupedBySupplier[supplierId]
      const totalAmount = items.reduce((sum: number, i: any) => sum + (i.unit_price * i.quantity), 0)

      // Ana sipariş kaydını at (purchase_orders)
      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .insert({
          user_id: userId,
          supplier_id: supplierId,
          total_amount: totalAmount,
          status: 'pending'
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Sipariş kalemlerini at (purchase_order_items)
      const orderItems = items.map((i: any) => ({
        order_id: order.id,
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        supplier_part_number: i.supplier_part_number
      }))

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError
    }

    // 4. İşlem bitince sepeti temizle
    await supabase.from('cart_items').delete().eq('user_id', userId)

    revalidatePath('/admin/orders')
    return { success: true }
  } catch (error: any) {
    console.error("Sipariş Hatası:", error.message)
    return { success: false, error: error.message }
  }
}