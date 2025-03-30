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
}

export interface Supermarket {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  totalSales: number;
  totalValue: number;
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
  pricePerUnit: number;
  status: 'pending' | 'completed';
  completedDate?: string;
} 