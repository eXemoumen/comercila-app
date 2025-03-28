import { PendingPaymentsPageClient } from "@/components/PendingPaymentsPageClient";

export default function PendingPaymentsPage() {
  return <PendingPaymentsPageClient onBack={() => window.history.back()} />;
} 