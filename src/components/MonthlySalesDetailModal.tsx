import React, { useMemo, useEffect, useState } from "react";
import {
  X,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Button } from "./ui/button";
import { getSupermarkets } from "@/utils/hybridStorage";
import type { Sale, Supermarket } from "@/types/index";

interface MonthlySalesDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthName: string;
  monthData: {
    quantity: number;
    value: number;
    netBenefit: number;
  };
  sales: Sale[];
  virementPeriod?: string;
}

export const MonthlySalesDetailModal: React.FC<
  MonthlySalesDetailModalProps
> = ({ isOpen, onClose, monthName, monthData, sales, virementPeriod }) => {
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);

  useEffect(() => {
    const loadSupermarkets = async () => {
      try {
        const data = await getSupermarkets();
        setSupermarkets(data);
      } catch (error) {
        console.error("Error loading supermarkets:", error);
      }
    };

    if (isOpen) {
      loadSupermarkets();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter sales for this specific month
  const monthSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = new Date(sale.date);
      const saleMonth = saleDate.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      });
      // Capitalize first letter for comparison
      const formattedSaleMonth =
        saleMonth.charAt(0).toUpperCase() + saleMonth.slice(1);
      return formattedSaleMonth === monthName;
    });
  }, [sales, monthName]);

  // Calculate payment statistics
  const paymentStats = useMemo(() => {
    const directPaid = monthSales.filter(
      (sale) => sale.isPaid && sale.payments.length === 1
    );
    const virementPaid = monthSales.filter(
      (sale) => sale.isPaid && sale.payments.length > 1
    );
    const unpaid = monthSales.filter((sale) => !sale.isPaid);

    return {
      directPaid: {
        count: directPaid.length,
        value: directPaid.reduce((sum, sale) => sum + sale.totalValue, 0),
        benefit: directPaid.reduce((sum, sale) => {
          const benefitPerUnit =
            sale.pricePerUnit === 180 ? 25 : sale.pricePerUnit === 166 ? 17 : 0;
          return sum + sale.quantity * benefitPerUnit;
        }, 0),
      },
      virementPaid: {
        count: virementPaid.length,
        value: virementPaid.reduce((sum, sale) => sum + sale.totalValue, 0),
        benefit: virementPaid.reduce((sum, sale) => {
          const benefitPerUnit =
            sale.pricePerUnit === 180 ? 25 : sale.pricePerUnit === 166 ? 17 : 0;
          return sum + sale.quantity * benefitPerUnit;
        }, 0),
      },
      unpaid: {
        count: unpaid.length,
        value: unpaid.reduce((sum, sale) => sum + sale.totalValue, 0),
        benefit: unpaid.reduce((sum, sale) => {
          const benefitPerUnit =
            sale.pricePerUnit === 180 ? 25 : sale.pricePerUnit === 166 ? 17 : 0;
          return sum + sale.quantity * benefitPerUnit;
        }, 0),
      },
    };
  }, [monthSales]);

  const getSupermarketName = (supermarketId: string) => {
    const supermarket = supermarkets.find((s) => s.id === supermarketId);
    return supermarket?.name || `Supermarket ${supermarketId.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-DZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getPaymentStatus = (sale: Sale) => {
    if (!sale.isPaid) {
      return {
        status: "unpaid",
        label: "Non payé",
        icon: Clock,
        color: "text-red-600",
        bgColor: "bg-red-100",
      };
    }

    if (sale.payments.length === 1) {
      return {
        status: "direct",
        label: "Payé directement",
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-100",
      };
    }

    // For virement payments, get the completion date
    const virementCompletionDate =
      sale.paymentDate ||
      (sale.payments.length > 0
        ? sale.payments[sale.payments.length - 1]?.date
        : null);

    return {
      status: "virement",
      label: `Payé par virement (${sale.payments.length} paiements)`,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      completionDate: virementCompletionDate,
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 rounded-full p-3">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Détail des Ventes - {monthName}
              </h2>
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

        {/* Month Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">
                Total Ventes
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {monthData.quantity.toLocaleString("fr-DZ")}
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
              {monthData.value.toLocaleString("fr-DZ")} DZD
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">
                Bénéfice Total
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {monthData.netBenefit.toLocaleString("fr-DZ")} DZD
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">
                Ventes Payées
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {monthSales.filter((s) => s.isPaid).length}/{monthSales.length}
            </p>
          </div>
        </div>

        {/* Payment Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Payé Directement
              </span>
            </div>
            <p className="text-lg font-bold text-green-800">
              {paymentStats.directPaid.count} ventes
            </p>
            <p className="text-sm text-green-600">
              {paymentStats.directPaid.value.toLocaleString("fr-DZ")} DZD
            </p>
            <p className="text-xs text-green-500">
              Bénéfice:{" "}
              {paymentStats.directPaid.benefit.toLocaleString("fr-DZ")} DZD
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                Payé par Virement
              </span>
            </div>
            <p className="text-lg font-bold text-blue-800">
              {paymentStats.virementPaid.count} ventes
            </p>
            <p className="text-sm text-blue-600">
              {paymentStats.virementPaid.value.toLocaleString("fr-DZ")} DZD
            </p>
            <p className="text-xs text-blue-500">
              Bénéfice:{" "}
              {paymentStats.virementPaid.benefit.toLocaleString("fr-DZ")} DZD
            </p>
          </div>

          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-700">Non Payé</span>
            </div>
            <p className="text-lg font-bold text-red-800">
              {paymentStats.unpaid.count} ventes
            </p>
            <p className="text-sm text-red-600">
              {paymentStats.unpaid.value.toLocaleString("fr-DZ")} DZD
            </p>
            <p className="text-xs text-red-500">
              Bénéfice: {paymentStats.unpaid.benefit.toLocaleString("fr-DZ")}{" "}
              DZD
            </p>
          </div>
        </div>

        {/* Virement Completion Summary */}
        {paymentStats.virementPaid.count > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <h4 className="text-lg font-semibold text-blue-800">
                Résumé des Virements Terminés
              </h4>
            </div>
            <div className="text-sm text-blue-700">
              <p className="mb-2">
                <strong>Important:</strong> Les bénéfices de ces ventes
                apparaissent dans le "Bénéfice Réel" du mois où le virement a
                été <strong>terminé</strong>, pas du mois où la vente a été
                faite.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {monthSales
                  .filter((sale) => sale.isPaid && sale.payments.length > 1)
                  .map((sale, index) => {
                    const completionDate =
                      sale.paymentDate ||
                      (sale.payments.length > 0
                        ? sale.payments[sale.payments.length - 1]?.date
                        : null);
                    const originalDate = formatDate(sale.date);
                    const completionDateFormatted = completionDate
                      ? formatDate(completionDate)
                      : "N/A";

                    return (
                      <div
                        key={sale.id}
                        className="bg-white rounded p-3 border border-blue-200"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-blue-800">
                              Vente du {originalDate}
                            </p>
                            <p className="text-xs text-blue-600">
                              {sale.quantity} unités -{" "}
                              {sale.totalValue.toLocaleString("fr-DZ")} DZD
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-600">
                              ✅ Terminé le {completionDateFormatted}
                            </p>
                            <p className="text-xs text-blue-600">
                              {sale.payments.length} paiements
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Sales Detail Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Détail des Ventes ({monthSales.length} ventes)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supermarché
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix/Unité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total (DZD)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bénéfice (DZD)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut Paiement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Détails
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthSales.map((sale, index) => {
                  const paymentStatus = getPaymentStatus(sale);
                  const StatusIcon = paymentStatus.icon;
                  const benefitPerUnit =
                    sale.pricePerUnit === 180
                      ? 25
                      : sale.pricePerUnit === 166
                      ? 17
                      : 0;
                  const totalBenefit = sale.quantity * benefitPerUnit;

                  return (
                    <tr
                      key={sale.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(sale.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getSupermarketName(sale.supermarketId)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {sale.quantity.toLocaleString("fr-DZ")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {sale.pricePerUnit.toLocaleString("fr-DZ")} DZD
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {sale.totalValue.toLocaleString("fr-DZ")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {totalBenefit.toLocaleString("fr-DZ")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <StatusIcon
                            className={`h-4 w-4 ${paymentStatus.color}`}
                          />
                          <div className="flex flex-col">
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${paymentStatus.bgColor} ${paymentStatus.color}`}
                            >
                              {paymentStatus.label}
                            </span>
                            {paymentStatus.status === "virement" &&
                              paymentStatus.completionDate && (
                                <span className="text-xs text-blue-600 font-medium mt-1">
                                  ✅ Terminé le:{" "}
                                  {formatDate(paymentStatus.completionDate)}
                                </span>
                              )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-600">
                          {sale.isPaid ? (
                            <div>
                              {sale.payments.length === 1 ? (
                                <p>
                                  Payé le:{" "}
                                  {sale.paymentDate
                                    ? formatDate(sale.paymentDate)
                                    : "N/A"}
                                </p>
                              ) : (
                                <div>
                                  <p className="text-blue-600 font-medium">
                                    💰 Virement terminé le:{" "}
                                    {sale.paymentDate
                                      ? formatDate(sale.paymentDate)
                                      : "N/A"}
                                  </p>
                                  <p className="text-blue-600">
                                    📅 {sale.payments.length} paiements au total
                                  </p>
                                  {sale.payments.length > 0 && (
                                    <p className="text-gray-500 text-xs">
                                      Dernier paiement:{" "}
                                      {formatDate(
                                        sale.payments[sale.payments.length - 1]
                                          .date
                                      )}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <p>
                                Restant:{" "}
                                {sale.remainingAmount?.toLocaleString("fr-DZ")}{" "}
                                DZD
                              </p>
                              {sale.expectedPaymentDate && (
                                <p>
                                  Attendu:{" "}
                                  {formatDate(sale.expectedPaymentDate)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
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
  );
};
