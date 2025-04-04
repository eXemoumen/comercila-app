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
}

export interface Supermarket {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  totalSales: number;
  totalValue: number;
  location: {
    lat: number;
    lng: number;
    formattedAddress: string;
  };
}

export interface Stock {
  id: string;
  date: string;
  type: 'added' | 'removed' | 'adjusted';
  quantity: number;
  currentStock: number;
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