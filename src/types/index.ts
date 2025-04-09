export interface Payment {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

export interface Sale {
  id: string;
  date: string;
  supermarketId: string;
  quantity: number;
  cartons: number;
  pricePerUnit: number;
  totalValue: number;
  isPaid: boolean;
  paymentDate?: string;
  paymentNote?: string;
  expectedPaymentDate?: string;
  payments: Payment[];
  remainingAmount: number;
  fromOrder?: boolean;
  note?: string;
  fragranceDistribution?: Record<string, number>;
}

export interface Supermarket {
  id: string;
  name: string;
  address: string;
  phoneNumbers: Array<{
    name: string;
    number: string;
  }>;
  email?: string;
  location: {
    lat: number;
    lng: number;
    formattedAddress: string;
  };
  totalSales: number;
  totalValue: number;
}

export interface Stock {
  id: string;
  supermarketId: string;
  quantity: number;
  cartons: number;
  pricePerUnit: number;
  date: string;
  note?: string;
}

export interface Order {
  id: string;
  date: string;
  supermarketId: string;
  supermarketName: string;
  quantity: number;
  status: "pending" | "delivered" | "cancelled";
  pricePerUnit: number;
}

export interface StockHistory {
  id: string;
  date: string;
  type: 'added' | 'removed' | 'adjusted';
  quantity: number;
  currentStock: number;
  reason: string;
  fragranceDistribution?: Record<string, number>;
}

export interface Fragrance {
  id: string;
  name: string;
  color: string;
}

export interface FragranceStock {
  fragranceId: string;
  name: string;
  quantity: number;
  color: string;
}

export interface CurrentStock {
  id: string;
  productId: string;
  quantity: number;
  updatedAt: string;
  fragranceStock: FragranceStock[];
} 