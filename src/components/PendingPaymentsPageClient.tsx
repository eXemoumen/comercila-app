"use client";

interface Payment {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

interface Sale {
  id: string;
  supermarketId?: string;
  date: string;
  totalValue: number;
  remainingAmount: number;
  isPaid: boolean;
  payments: Payment[];
}

interface PendingPaymentsPageProps {
  onBack: () => void;
}

export function PendingPaymentsPageClient({
  onBack,
}: PendingPaymentsPageProps) {
  // Example data for demonstration purposes
  const pendingSales: Sale[] = []; // Replace with actual data fetching logic

  return (
    <div>
      <button onClick={onBack}>Back</button>
      <h1>Pending Payments</h1>
      {pendingSales.length === 0 ? (
        <p>No pending payments available.</p>
      ) : (
        <ul>
          {pendingSales.map((sale) => (
            <li key={sale.id}>
              <p>Sale ID: {sale.id}</p>
              <p>Total Value: {sale.totalValue}</p>
              <p>Remaining Amount: {sale.remainingAmount}</p>
              <p>Is Paid: {sale.isPaid ? "Yes" : "No"}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
