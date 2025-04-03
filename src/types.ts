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