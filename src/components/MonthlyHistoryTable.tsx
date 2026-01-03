"use client";

import React, { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, Calendar, Package } from "lucide-react";

interface MonthlyData {
  quantity: number;
  value: number;
  netBenefit: number;
}

interface MonthlyHistoryTableProps {
  monthlyBenefits: Record<string, MonthlyData>;
  monthlyPaidBenefits: Record<string, MonthlyData>;
  className?: string;
}

const monthNamesMap: Record<string, number> = {
  janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
  juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11,
};

export function MonthlyHistoryTable({
  monthlyBenefits,
  monthlyPaidBenefits,
  className = "",
}: MonthlyHistoryTableProps) {
  const sortedMonths = useMemo(() => {
    const allMonths = new Set([
      ...Object.keys(monthlyBenefits),
      ...Object.keys(monthlyPaidBenefits),
    ]);
    return Array.from(allMonths).sort((a, b) => {
      const [mA, yA] = [a.split(" ")[0].toLowerCase(), a.split(" ")[1]];
      const [mB, yB] = [b.split(" ")[0].toLowerCase(), b.split(" ")[1]];
      if (yA !== yB) return parseInt(yB) - parseInt(yA);
      return (monthNamesMap[mB] || 0) - (monthNamesMap[mA] || 0);
    });
  }, [monthlyBenefits, monthlyPaidBenefits]);

  const totals = useMemo(() => ({
    estimatedTotal: Object.values(monthlyBenefits).reduce((s, d) => s + d.netBenefit, 0),
    realTotal: Object.values(monthlyPaidBenefits).reduce((s, d) => s + d.netBenefit, 0),
    estimatedQty: Object.values(monthlyBenefits).reduce((s, d) => s + d.quantity, 0),
    realQty: Object.values(monthlyPaidBenefits).reduce((s, d) => s + d.quantity, 0),
  }), [monthlyBenefits, monthlyPaidBenefits]);

  if (sortedMonths.length === 0) {
    return (
      <div className={`premium-card p-6 text-center ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
          <Calendar className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune donnée</h3>
        <p className="text-sm text-gray-500">Les données apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-800">Historique Comparatif</h3>
              <p className="text-xs text-gray-500">Estimé vs Réel • {sortedMonths.length} mois</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-gray-600">Estimé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs font-medium text-gray-600">Réel</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Période</th>
              <th className="px-4 py-4 text-center text-xs font-semibold text-emerald-600 uppercase" colSpan={2}>Estimé</th>
              <th className="px-4 py-4 text-center text-xs font-semibold text-blue-600 uppercase" colSpan={2}>Réel</th>
              <th className="px-4 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Écart</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedMonths.map((month, idx) => {
              const est = monthlyBenefits[month] || { quantity: 0, value: 0, netBenefit: 0 };
              const real = monthlyPaidBenefits[month] || { quantity: 0, value: 0, netBenefit: 0 };
              const diff = real.netBenefit - est.netBenefit;
              const pct = est.netBenefit > 0 ? ((diff / est.netBenefit) * 100).toFixed(0) : "0";

              return (
                <tr key={month} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                        <span className="text-sm font-bold text-gray-600 group-hover:text-indigo-600">
                          {month.split(" ")[0].substring(0, 3).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{month}</p>
                        {idx === 0 && <p className="text-xs text-gray-400">Mois actuel</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Package className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium text-gray-800">{Math.floor(est.quantity / 9)} cartons</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-sm">
                      {est.netBenefit.toLocaleString("fr-DZ")} DZD
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Package className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium text-gray-800">{Math.floor(real.quantity / 9)} cartons</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-semibold text-sm">
                      {real.netBenefit.toLocaleString("fr-DZ")} DZD
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      diff > 0 ? "bg-emerald-100 text-emerald-700" : diff < 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {diff > 0 ? <TrendingUp className="w-3 h-3" /> : diff < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      {diff !== 0 ? `${pct}%` : "—"}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-t border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-xl bg-white shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Total Estimé</p>
            <p className="text-lg font-bold text-emerald-600">{totals.estimatedTotal.toLocaleString("fr-DZ")} DZD</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-white shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Total Réel</p>
            <p className="text-lg font-bold text-blue-600">{totals.realTotal.toLocaleString("fr-DZ")} DZD</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-white shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Cartons Estimés</p>
            <p className="text-lg font-bold text-gray-700">{Math.floor(totals.estimatedQty / 9).toLocaleString("fr-DZ")}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-white shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Cartons Réels</p>
            <p className="text-lg font-bold text-gray-700">{Math.floor(totals.realQty / 9).toLocaleString("fr-DZ")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
