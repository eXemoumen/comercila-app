import React, { useMemo, useEffect, useState } from "react";
import {
  X,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "./ui/button";
import { getSupermarkets } from "@/utils/hybridStorage";
import { isAndroid, mobileUtils } from "@/utils/mobileConfig";
import type { Sale } from "@/types/index";
import type { Supermarket } from "@/utils/storage";

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
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    statistics: true,
    virementSummary: true,
    salesTable: false,
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

  // Filter sales for this specific month
  const monthSales = useMemo(() => {
    if (!isOpen) return [];

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
  }, [sales, monthName, isOpen]);

  // Calculate payment statistics
  const paymentStats = useMemo(() => {
    if (!isOpen)
      return {
        directPaid: { count: 0, value: 0, benefit: 0 },
        virementPaid: { count: 0, value: 0, benefit: 0 },
        unpaid: { count: 0, value: 0, benefit: 0 },
      };

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
  }, [monthSales, isOpen]);

  if (!isOpen) return null;

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

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
      <div
        className={`bg-white rounded-xl w-full max-h-[95vh] overflow-hidden ${
          isMobile ? "h-full" : "max-w-6xl"
        }`}
      >
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  Détail des Ventes - {monthName}
                </h2>
                {virementPeriod && virementPeriod !== "mois en cours" && (
                  <p className="text-sm text-blue-100">
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
          {/* Month Summary Cards - Mobile Optimized */}
          <div
            className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}
          >
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">
                  Total Ventes
                </span>
              </div>
              <p className="text-xl font-bold text-blue-800">
                {monthData.quantity.toLocaleString("fr-DZ")}
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
                {monthData.value.toLocaleString("fr-DZ")} DZD
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">
                  Bénéfice Total
                </span>
              </div>
              <p className="text-xl font-bold text-green-800">
                {monthData.netBenefit.toLocaleString("fr-DZ")} DZD
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 border border-amber-200">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">
                  Ventes Payées
                </span>
              </div>
              <p className="text-xl font-bold text-amber-800">
                {monthSales.filter((s) => s.isPaid).length}/{monthSales.length}
              </p>
            </div>
          </div>

          {/* Payment Statistics - Collapsible */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection("statistics")}
              className="w-full bg-gray-50 px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-800">
                Statistiques de Paiement
              </h3>
              {expandedSections.statistics ? (
                <ChevronUp className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              )}
            </button>

            {expandedSections.statistics && (
              <div className="p-4">
                <div
                  className={`grid gap-3 ${
                    isMobile ? "grid-cols-1" : "grid-cols-3"
                  }`}
                >
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
                      {paymentStats.directPaid.value.toLocaleString("fr-DZ")}{" "}
                      DZD
                    </p>
                    <p className="text-xs text-green-500">
                      Bénéfice:{" "}
                      {paymentStats.directPaid.benefit.toLocaleString("fr-DZ")}{" "}
                      DZD
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
                      {paymentStats.virementPaid.value.toLocaleString("fr-DZ")}{" "}
                      DZD
                    </p>
                    <p className="text-xs text-blue-500">
                      Bénéfice:{" "}
                      {paymentStats.virementPaid.benefit.toLocaleString(
                        "fr-DZ"
                      )}{" "}
                      DZD
                    </p>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-medium text-red-700">
                        Non Payé
                      </span>
                    </div>
                    <p className="text-lg font-bold text-red-800">
                      {paymentStats.unpaid.count} ventes
                    </p>
                    <p className="text-sm text-red-600">
                      {paymentStats.unpaid.value.toLocaleString("fr-DZ")} DZD
                    </p>
                    <p className="text-xs text-red-500">
                      Bénéfice:{" "}
                      {paymentStats.unpaid.benefit.toLocaleString("fr-DZ")} DZD
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Virement Completion Summary - Collapsible */}
          {paymentStats.virementPaid.count > 0 && (
            <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
              <button
                onClick={() => toggleSection("virementSummary")}
                className="w-full bg-blue-50 px-4 py-3 flex items-center justify-between hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h4 className="text-lg font-semibold text-blue-800">
                    Résumé des Virements Terminés
                  </h4>
                </div>
                {expandedSections.virementSummary ? (
                  <ChevronUp className="h-5 w-5 text-blue-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-blue-600" />
                )}
              </button>

              {expandedSections.virementSummary && (
                <div className="p-4 bg-blue-50">
                  <div className="text-sm text-blue-700 mb-3">
                    <p className="mb-2">
                      <strong>Important:</strong> Les bénéfices de ces ventes
                      apparaissent dans le &quot;Bénéfice Réel&quot; du mois où
                      le virement a été <strong>terminé</strong>, pas du mois où
                      la vente a été faite.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {monthSales
                      .filter((sale) => sale.isPaid && sale.payments.length > 1)
                      .map((sale) => {
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
                            className="bg-white rounded-lg p-3 border border-blue-200"
                          >
                            <div className="flex flex-col space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-blue-800">
                                    Vente du {originalDate}
                                  </p>
                                  <p className="text-xs text-blue-600">
                                    {sale.quantity} unités -{" "}
                                    {sale.totalValue.toLocaleString("fr-DZ")}{" "}
                                    DZD
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
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sales Detail Table - Collapsible */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection("salesTable")}
              className="w-full bg-gray-50 px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-800">
                Détail des Ventes ({monthSales.length} ventes)
              </h3>
              {expandedSections.salesTable ? (
                <ChevronUp className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              )}
            </button>

            {expandedSections.salesTable && (
              <div className="p-4">
                {isMobile ? (
                  // Mobile-friendly card layout
                  <div className="space-y-3">
                    {monthSales.map((sale) => {
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
                        <div
                          key={sale.id}
                          className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                        >
                          <div className="space-y-2">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <StatusIcon
                                  className={`h-4 w-4 ${paymentStatus.color}`}
                                />
                                <span
                                  className={`text-xs px-2 py-1 rounded-full font-medium ${paymentStatus.bgColor} ${paymentStatus.color}`}
                                >
                                  {paymentStatus.status === "virement"
                                    ? "Virement"
                                    : paymentStatus.label}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-gray-800">
                                  {totalBenefit.toLocaleString("fr-DZ")} DZD
                                </p>
                                <p className="text-xs text-gray-600">
                                  Bénéfice
                                </p>
                              </div>
                            </div>

                            {/* Sale Details */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-gray-600">
                                  Date: {formatDate(sale.date)}
                                </p>
                                <p className="text-gray-600">
                                  Supermarché:{" "}
                                  {getSupermarketName(sale.supermarketId)}
                                </p>
                                <p className="text-gray-600">
                                  Quantité: {sale.quantity}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">
                                  Prix/Unité: {sale.pricePerUnit} DZD
                                </p>
                                <p className="text-gray-600">
                                  Total:{" "}
                                  {sale.totalValue.toLocaleString("fr-DZ")} DZD
                                </p>
                                <p className="text-gray-600">
                                  Statut: {paymentStatus.label}
                                </p>
                              </div>
                            </div>

                            {/* Payment Details */}
                            {sale.isPaid ? (
                              <div className="bg-green-50 rounded p-2 border border-green-200">
                                {sale.payments.length === 1 ? (
                                  <p className="text-xs text-green-700">
                                    Payé le:{" "}
                                    {sale.paymentDate
                                      ? formatDate(sale.paymentDate)
                                      : "N/A"}
                                  </p>
                                ) : (
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-blue-700">
                                      💰 Virement terminé le:{" "}
                                      {sale.paymentDate
                                        ? formatDate(sale.paymentDate)
                                        : "N/A"}
                                    </p>
                                    <p className="text-xs text-blue-600">
                                      📅 {sale.payments.length} paiements au
                                      total
                                    </p>
                                    {sale.payments.length > 0 && (
                                      <p className="text-xs text-gray-600">
                                        Dernier paiement:{" "}
                                        {formatDate(
                                          sale.payments[
                                            sale.payments.length - 1
                                          ].date
                                        )}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="bg-red-50 rounded p-2 border border-red-200">
                                <p className="text-xs text-red-700">
                                  Restant:{" "}
                                  {sale.remainingAmount?.toLocaleString(
                                    "fr-DZ"
                                  )}{" "}
                                  DZD
                                </p>
                                {sale.expectedPaymentDate && (
                                  <p className="text-xs text-red-600">
                                    Attendu:{" "}
                                    {formatDate(sale.expectedPaymentDate)}
                                  </p>
                                )}
                              </div>
                            )}
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
                        {monthSales.map((sale) => {
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
                            <tr key={sale.id} className="hover:bg-gray-50">
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
                                  {sale.pricePerUnit.toLocaleString("fr-DZ")}{" "}
                                  DZD
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
                                          {formatDate(
                                            paymentStatus.completionDate
                                          )}
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
                                            📅 {sale.payments.length} paiements
                                            au total
                                          </p>
                                          {sale.payments.length > 0 && (
                                            <p className="text-xs text-gray-500">
                                              Dernier paiement:{" "}
                                              {formatDate(
                                                sale.payments[
                                                  sale.payments.length - 1
                                                ].date
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
                                        {sale.remainingAmount?.toLocaleString(
                                          "fr-DZ"
                                        )}{" "}
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
