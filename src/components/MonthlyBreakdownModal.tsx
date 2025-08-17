import React, { useState } from "react";
import {
  X,
  TrendingUp,
  DollarSign,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { MonthlySalesDetailModal } from "./MonthlySalesDetailModal";
import type { Sale } from "@/types/index";

interface MonthlyData {
  quantity: number;
  value: number;
  netBenefit: number;
}

interface MonthlyBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyBenefits: Record<string, MonthlyData>;
  title: string;
  type: "estimated" | "paid";
  virementPeriod?: string;
  sales: Sale[];
}

export const MonthlyBreakdownModal: React.FC<MonthlyBreakdownModalProps> = ({
  isOpen,
  onClose,
  monthlyBenefits,
  title,
  type,
  virementPeriod,
  sales,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [showSalesDetail, setShowSalesDetail] = useState(false);

  if (!isOpen) return null;

  // Sort months by date (newest first)
  const sortedMonths = Object.entries(monthlyBenefits).sort(([, a], [, b]) => {
    // Convert month names to dates for proper sorting
    const monthA = new Date(a.value > 0 ? "2024-01-01" : "2024-01-01"); // Placeholder date
    const monthB = new Date(b.value > 0 ? "2024-01-01" : "2024-01-01");
    return monthB.getTime() - monthA.getTime();
  });

  const totalBenefit = Object.values(monthlyBenefits).reduce((sum, month) => {
    if (type === "estimated") {
      return sum + month.netBenefit;
    } else {
      // For paid benefits, only count if there are sales in that month
      return sum + (month.value > 0 ? month.netBenefit : 0);
    }
  }, 0);

  const totalQuantity = Object.values(monthlyBenefits).reduce((sum, month) => {
    if (type === "estimated") {
      return sum + month.quantity;
    } else {
      return sum + (month.value > 0 ? month.quantity : 0);
    }
  }, 0);

  const totalValue = Object.values(monthlyBenefits).reduce((sum, month) => {
    if (type === "estimated") {
      return sum + month.value;
    } else {
      return sum + (month.value > 0 ? month.value : 0);
    }
  }, 0);

  const handleMonthClick = (monthName: string, monthData: MonthlyData) => {
    setSelectedMonth(monthName);
    setShowSalesDetail(true);
  };

  const handleCloseSalesDetail = () => {
    setShowSalesDetail(false);
    setSelectedMonth(null);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-full ${
                  type === "estimated" ? "bg-green-100" : "bg-amber-100"
                }`}
              >
                {type === "estimated" ? (
                  <TrendingUp
                    className={`h-6 w-6 ${
                      type === "estimated" ? "text-green-600" : "text-amber-600"
                    }`}
                  />
                ) : (
                  <DollarSign className="h-6 w-6 text-amber-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                {virementPeriod && virementPeriod !== "mois en cours" && (
                  <p className="text-sm text-gray-600">
                    Période: {virementPeriod}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">
                  Bénéfice Total
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {totalBenefit.toLocaleString("fr-DZ")} DZD
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">
                  Quantité Totale
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {totalQuantity.toLocaleString("fr-DZ")}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-600">
                  Valeur Totale
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {totalValue.toLocaleString("fr-DZ")} DZD
              </p>
            </div>
          </div>

          {/* Monthly Breakdown Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Détail Mensuel
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                👆 Cliquez sur un mois pour voir le détail des ventes
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mois
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valeur (DZD)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bénéfice (DZD)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedMonths.map(([monthName, monthData], index) => {
                    const hasData = monthData.value > 0;
                    const isPaid = type === "paid" ? hasData : true;

                    return (
                      <tr
                        key={monthName}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } ${
                          hasData
                            ? "cursor-pointer hover:bg-blue-50 transition-colors"
                            : ""
                        }`}
                        onClick={() =>
                          hasData && handleMonthClick(monthName, monthData)
                        }
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {monthName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {hasData
                              ? monthData.quantity.toLocaleString("fr-DZ")
                              : "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {hasData
                              ? monthData.value.toLocaleString("fr-DZ")
                              : "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`text-sm font-medium ${
                              hasData ? "text-gray-900" : "text-gray-400"
                            }`}
                          >
                            {hasData
                              ? monthData.netBenefit.toLocaleString("fr-DZ")
                              : "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              isPaid
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {isPaid ? "Inclus" : "Non inclus"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hasData && (
                            <div className="flex items-center text-blue-600">
                              <span className="text-xs font-medium mr-1">
                                Voir détails
                              </span>
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <Button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              Fermer
            </Button>
          </div>
        </div>
      </div>

      {/* Sales Detail Modal */}
      {selectedMonth && (
        <MonthlySalesDetailModal
          isOpen={showSalesDetail}
          onClose={handleCloseSalesDetail}
          monthName={selectedMonth}
          monthData={monthlyBenefits[selectedMonth]}
          sales={sales}
          virementPeriod={virementPeriod}
        />
      )}
    </>
  );
};
