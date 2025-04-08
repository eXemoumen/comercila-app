import { getSales, getSupermarkets, getOrders, getStockHistory } from './storage';
import { Sale, Supermarket, Order, StockHistory } from '@/types';

interface BackupData {
  version: string;
  timestamp: string;
  data: {
    sales: Sale[];
    supermarkets: Supermarket[];
    orders: Order[];
    stockHistory: StockHistory[];
  };
}

export async function createBackup(): Promise<string> {
  try {
    const [sales, supermarkets, orders, stockHistory] = await Promise.all([
      getSales(),
      getSupermarkets(),
      getOrders(),
      getStockHistory(),
    ]);

    const backupData: BackupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      data: {
        sales,
        supermarkets,
        orders,
        stockHistory,
      },
    };

    // Convert to JSON and create a downloadable file
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `gestion-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return 'Backup created successfully';
  } catch (error) {
    console.error('Error creating backup:', error);
    throw new Error('Failed to create backup');
  }
}

export async function restoreBackup(file: File): Promise<void> {
  try {
    const text = await file.text();
    const backupData: BackupData = JSON.parse(text);

    // Validate backup data structure
    if (!backupData.version || !backupData.timestamp || !backupData.data) {
      throw new Error('Invalid backup file format');
    }

    // Clear existing data
    localStorage.clear();

    // Restore data
    localStorage.setItem('soap_sales', JSON.stringify(backupData.data.sales));
    localStorage.setItem('soap_supermarkets', JSON.stringify(backupData.data.supermarkets));
    localStorage.setItem('soap_orders', JSON.stringify(backupData.data.orders));
    localStorage.setItem('soap_stock', JSON.stringify(backupData.data.stockHistory));

    // Reload the page to refresh all states
    window.location.reload();
  } catch (error) {
    console.error('Error restoring backup:', error);
    throw new Error('Failed to restore backup');
  }
} 