"use client";

import { useState, useEffect } from "react";
import { getSupermarkets } from "@/lib/supermarkets";
import { useLocalStorage } from "@/hooks/use-local-storage";

function SupermarketProfile({
  onBack,
  supermarketId,
  setActiveTab,
}: SupermarketProfilePageProps) {
  const [supermarket, setSupermarket] = useState<Supermarket | null>(null);
  const [orders] = useLocalStorage<Order[]>("soap_orders", []);
  const [sales] = useLocalStorage<Sale[]>("soap_sales", []);

  useEffect(() => {
    const sm = getSupermarkets().find((s) => s.id === supermarketId);
    setSupermarket(sm || null);
  }, [supermarketId]);

  // Filter orders and sales for this supermarket
  const filteredOrders = orders.filter(
    (order) => order.supermarketId === supermarketId
  );
  const filteredSales = sales.filter(
    (sale) => sale.supermarketId === supermarketId
  );

  // ... rest of the component
}

// Move the entire SupermarketProfilePage component here
// Keep the same code but in a new file
