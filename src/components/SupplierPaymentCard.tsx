import React from "react";
import { MetricCard } from "./MetricCard";
import { CreditCard } from "lucide-react";

export interface SupplierPaymentCardProps {
    supplierPayment: number;
    totalRevenue: number;
    className?: string;
}

export const SupplierPaymentCard: React.FC<SupplierPaymentCardProps> = ({
    supplierPayment,
    totalRevenue,
    className
}) => {
    const percentage = totalRevenue > 0
        ? Math.round((supplierPayment / totalRevenue) * 100)
        : 0;

    return (
        <MetricCard
            title="À Retourner au Fournisseur (Ce Mois)"
            value={`${supplierPayment.toLocaleString("fr-DZ")} DZD`}
            color="red"
            icon={CreditCard}
            percentage={percentage}
            className={`col-span-2 ${className}`}
        >
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-2xl font-bold text-gray-800 animate-in slide-in-from-bottom-1 duration-300">
                        {supplierPayment.toLocaleString("fr-DZ")} DZD
                    </div>
                </div>
                <div className="text-3xl font-bold text-red-500">
                    {percentage}%
                </div>
            </div>
            <div className="mt-3 text-sm text-gray-500">
                Ce montant représente ce qui doit être retourné au fournisseur pour les ventes réalisées ce mois-ci.
            </div>
        </MetricCard>
    );
};