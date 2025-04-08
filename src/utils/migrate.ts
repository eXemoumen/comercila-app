import { supabase } from '@/lib/supabase'
import { getSupermarkets, getSales, getOrders, getStockHistory } from './storage'

export async function migrateToSupabase() {
  try {
    // Check if data already exists in Supabase
    const { data: existingSupermarkets } = await supabase
      .from('supermarkets')
      .select('id')
      .limit(1)

    if (existingSupermarkets && existingSupermarkets.length > 0) {
      console.log('Data already exists in Supabase. Skipping migration.')
      return { success: true, message: 'Data already exists in Supabase' }
    }

    // Migrate supermarkets
    const supermarkets = getSupermarkets()
    for (const supermarket of supermarkets) {
      const { error } = await supabase
        .from('supermarkets')
        .insert({
          id: supermarket.id,
          name: supermarket.name,
          address: supermarket.address,
          phone: supermarket.phone,
          email: supermarket.email,
          total_sales: supermarket.totalSales,
          total_value: supermarket.totalValue,
          location: supermarket.location
        })

      if (error) {
        console.error('Error migrating supermarket:', error)
        throw error
      }
    }

    // Migrate sales
    const sales = getSales()
    for (const sale of sales) {
      const { error } = await supabase
        .from('sales')
        .insert({
          id: sale.id,
          date: sale.date,
          supermarket_id: sale.supermarketId,
          quantity: sale.quantity,
          cartons: sale.cartons,
          price_per_unit: sale.pricePerUnit,
          total_value: sale.totalValue,
          is_paid: sale.isPaid,
          payment_date: sale.paymentDate,
          payment_note: sale.paymentNote,
          expected_payment_date: sale.expectedPaymentDate,
          payments: sale.payments,
          remaining_amount: sale.remainingAmount
        })

      if (error) {
        console.error('Error migrating sale:', error)
        throw error
      }
    }

    // Migrate orders
    const orders = getOrders()
    for (const order of orders) {
      const { error } = await supabase
        .from('orders')
        .insert({
          id: order.id,
          date: order.date,
          supermarket_id: order.supermarketId,
          supermarket_name: order.supermarketName,
          quantity: order.quantity,
          price_per_unit: order.pricePerUnit,
          status: order.status
        })

      if (error) {
        console.error('Error migrating order:', error)
        throw error
      }
    }

    // Migrate stock history
    const stockHistory = getStockHistory()
    for (const history of stockHistory) {
      const { error } = await supabase
        .from('stock_history')
        .insert({
          id: history.id,
          date: history.date,
          quantity: history.quantity,
          type: history.type,
          reason: history.reason
        })

      if (error) {
        console.error('Error migrating stock history:', error)
        throw error
      }
    }

    return { success: true, message: 'Migration completed successfully' }
  } catch (error) {
    console.error('Error during migration:', error)
    return { success: false, message: 'Migration failed', error }
  }
} 