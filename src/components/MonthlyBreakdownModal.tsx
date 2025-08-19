import React, { useState, useEffect } from "react";
import {
  X,
  TrendingUp,
  DollarSign,
  Calendar,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "./ui/button";
import { MonthlySalesDetailModal } from "./MonthlySalesDetailModal";
import { isAndroid, mobileUtils } from "@/utils/mobileConfig";
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
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    monthlyTable: true,
  });

  // Check if mobile and apply Android optimizations
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (isAndroid() && mobile) {
        console.log("🤖 Android mobile detected - applying optimizations");
        mobileUtils.optimizeForVirements();
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isOpen) return null;

  // Debug: Log the data being received
  console.log("🔍 MonthlyBreakdownModal Debug:", {
    type,
    title,
    monthlyBenefitsKeys: Object.keys(monthlyBenefits),
    monthlyBenefitsValues: Object.values(monthlyBenefits),
    totalEntries: Object.entries(monthlyBenefits).length,
    salesCount: sales.length,
  });

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

  const handleMonthClick = (monthName: string) => {
    setSelectedMonth(monthName);
    setShowSalesDetail(true);
  };

  const handleCloseSalesDetail = () => {
    setShowSalesDetail(false);
    setSelectedMonth(null);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
        <div
          className={`bg-white rounded-xl w-full max-h-[95vh] overflow-hidden ${
            isMobile ? "h-full" : "max-w-4xl"
          }`}
        >
          {/* Header - Fixed */}
          <div
            className={`text-white p-4 rounded-t-xl ${
              type === "estimated"
                ? "bg-gradient-to-r from-green-600 to-green-700"
                : "bg-gradient-to-r from-amber-600 to-amber-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 rounded-full p-2">
                  {type === "estimated" ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <DollarSign className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{title}</h2>
                  {virementPeriod && virementPeriod !== "mois en cours" && (
                    <p className="text-sm text-white text-opacity-90">
                      Période: {virementPeriod}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="overflow-y-auto p-4 space-y-4 max-h-[calc(95vh-80px)]">
            {/* Summary Cards - Mobile Optimized */}
            <div
              className={`grid gap-3 ${
                isMobile ? "grid-cols-2" : "grid-cols-3"
              }`}
            >
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700">
                    Bénéfice Total
                  </span>
                </div>
                <p className="text-xl font-bold text-green-800">
                  {totalBenefit.toLocaleString("fr-DZ")} DZD
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">
                    Quantité Totale
                  </span>
                </div>
                <p className="text-xl font-bold text-blue-800">
                  {totalQuantity.toLocaleString("fr-DZ")}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-medium text-purple-700">
                    Valeur Totale
                  </span>
                </div>
                <p className="text-xl font-bold text-purple-800">
                  {totalValue.toLocaleString("fr-DZ")} DZD
                </p>
              </div>
            </div>

            {/* Monthly Breakdown - Collapsible */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection("monthlyTable")}
                className="w-full bg-gray-50 px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Détail Mensuel
                  </h3>
                  <span className="text-sm text-gray-600">
                    ({sortedMonths.length} mois)
                  </span>
                </div>
                {expandedSections.monthlyTable ? (
                  <ChevronUp className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-600" />
                )}
              </button>

              {expandedSections.monthlyTable && (
                <div className="p-4">
                  <div className="text-sm text-gray-600 mb-3 text-center">
                    👆 Cliquez sur un mois pour voir le détail des ventes
                  </div>

                  {isMobile ? (
                    // Mobile-friendly card layout
                    <div className="space-y-3">
                      {sortedMonths.map(([monthName]) => {
                        const monthData = monthlyBenefits[monthName];
                        const hasData = monthData.value > 0;
                        const isPaid = type === "paid" ? hasData : true;

                        return (
                          <div
                            key={monthName}
                            className={`rounded-lg border transition-all ${
                              hasData
                                ? "bg-white border-blue-200 hover:border-blue-300 cursor-pointer hover:shadow-md"
                                : "bg-gray-50 border-gray-200"
                            }`}
                            onClick={() =>
                              hasData && handleMonthClick(monthName)
                            }
                          >
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-800">
                                  {monthName}
                                </h4>
                                {hasData && (
                                  <div className="flex items-center text-blue-600">
                                    <span className="text-xs font-medium mr-1">
                                      Voir détails
                                    </span>
                                    <ChevronRight className="h-4 w-4" />
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-3 gap-3 text-sm">
                                <div className="text-center">
                                  <p className="text-gray-600 text-xs">
                                    Quantité
                                  </p>
                                  <p className="font-medium text-gray-800">
                                    {hasData
                                      ? monthData.quantity.toLocaleString(
                                          "fr-DZ"
                                        )
                                      : "-"}
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-gray-600 text-xs">
                                    Valeur
                                  </p>
                                  <p className="font-medium text-gray-800">
                                    {hasData
                                      ? monthData.value.toLocaleString("fr-DZ")
                                      : "-"}
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-gray-600 text-xs">
                                    Bénéfice
                                  </p>
                                  <p
                                    className={`font-medium ${
                                      hasData
                                        ? "text-gray-800"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {hasData
                                      ? monthData.netBenefit.toLocaleString(
                                          "fr-DZ"
                                        )
                                      : "-"}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-2 text-center">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    isPaid
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {isPaid ? "Inclus" : "Non inclus"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Desktop table layout
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
                          {sortedMonths.map(([monthName]) => {
                            const monthData = monthlyBenefits[monthName];
                            const hasData = monthData.value > 0;
                            const isPaid = type === "paid" ? hasData : true;

                            return (
                              <tr
                                key={monthName}
                                className={`${
                                  hasData
                                    ? "cursor-pointer hover:bg-blue-50 transition-colors"
                                    : ""
                                }`}
                                onClick={() =>
                                  hasData && handleMonthClick(monthName)
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
                                      ? monthData.quantity.toLocaleString(
                                          "fr-DZ"
                                        )
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
                                      hasData
                                        ? "text-gray-900"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {hasData
                                      ? monthData.netBenefit.toLocaleString(
                                          "fr-DZ"
                                        )
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
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer - Fixed */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <div className="flex justify-end">
              <Button
                onClick={onClose}
                className={`px-6 py-2 rounded-lg text-white ${
                  type === "estimated"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                Fermer
              </Button>
            </div>
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
          type={type === "paid" ? "real" : "estimated"}
        />
      )}
    </>
  );
};
