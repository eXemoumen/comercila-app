import { getOrders } from './storage';
import { Order } from '@/types/index';

/**
 * Get orders for a specific supermarket
 */
export async function getSupermarketOrders(
  supermarketId: string
): Promise<Order[]> {
  try {
    // Get all orders and filter by supermarketId
    const allOrders = await getOrders();
    return allOrders.filter(order => order.supermarketId === supermarketId);
  } catch (error) {
    console.error("Error fetching supermarket orders:", error);
    return [];
  }
} 