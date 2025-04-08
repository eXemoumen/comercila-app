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
  supermarketName?: string;
  quantity: number;
  pricePerUnit: number;
  cartons: number;
  isPaid: boolean;
  expectedPaymentDate?: string;
  totalValue: number;
  paymentDate?: string;
  paymentNote?: string;
  payments: Payment[];
  remainingAmount: number;
  note?: string;
  orderId?: string;
}

export interface ContactNumber {
  number: string;
  personName?: string;
}

export interface Supermarket {
  id: string;
  name: string;
  address: string;
  phone: string;
  totalSales: number;
  totalValue: number;
  location: {
    lat: number;
    lng: number;
    formattedAddress: string;
  };
}

export interface Stock {
  id: number;
  current_stock: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  supermarketId: string;
  quantity: number;
  status: 'pending' | 'delivered' | 'cancelled';
  date: string;
  note?: string;
  cartons?: number;
  totalPrice?: number;
  pricePerUnit?: number;
}

export interface StockHistory {
  id: string;
  quantity: number;
  type: 'in' | 'out';
  date: string;
  reason: string;
} 