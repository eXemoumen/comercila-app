"use client";

interface MonthlyData {
  quantity: number;
  value: number;
  netBenefit: number;
}

interface MonthlyHistoryTableProps {
  monthlyBenefits: Record<string, MonthlyData>; // Estimated benefits
  monthlyPaidBenefits: Record<string, MonthlyData>; // Real benefits
  className?: string;
}

// French month names mapping for proper sorting
const monthNamesMap: Record<string, number> = {
  janvier: 0,
  février: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  août: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  décembre: 11,
};

export function MonthlyHistoryTable({
  monthlyBenefits,
  monthlyPaidBenefits,
  className = "",
}: MonthlyHistoryTableProps) {
  // Combine both datasets and get unique months
  const allMonths = new Set([
    ...Object.keys(monthlyBenefits),
    ...Object.keys(monthlyPaidBenefits),
  ]);

  const sortedMonths = Array.from(allMonths).sort((a, b) => {
    const monthA = a.split(" ")[0].toLowerCase();
    const yearA = a.split(" ")[1];
    const monthB = b.split(" ")[0].toLowerCase();
    const yearB = b.split(" ")[1];

    if (yearA !== yearB) {
      return parseInt(yearA) - parseInt(yearB);
    }
    return (monthNamesMap[monthA] || 0) - (monthNamesMap[monthB] || 0);
  });

  if (sortedMonths.length === 0) {
    return (
      <div
        className={`bg-white rounded-xl shadow-md border-none overflow-hidden ${className}`}
      >
        <div className="p-3 border-b">
          <h3 className="text-sm font-medium text-gray-700">
            Historique Mensuel
          </h3>
        </div>
        <div className="p-8 text-center text-gray-500">
          <p className="text-sm">Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl shadow-md border-none overflow-hidden ${className}`}
    >
      <div className="p-3 border-b">
        <h3 className="text-sm font-medium text-gray-700">
          Historique Mensuel - Estimé vs Réel
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table
          className="w-full"
          role="table"
          aria-label="Historique mensuel des ventes"
        >
          <thead>
            <tr className="bg-gray-50">
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                scope="col"
              >
                Mois
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                scope="col"
                colSpan={2}
              >
                Bénéfice Estimé
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                scope="col"
                colSpan={2}
              >
                Bénéfice Réel
              </th>
            </tr>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mois
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ventes
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bénéfice
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ventes
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bénéfice
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedMonths.map((month) => {
              const estimatedData = monthlyBenefits[month] || {
                quantity: 0,
                value: 0,
                netBenefit: 0,
              };
              const realData = monthlyPaidBenefits[month] || {
                quantity: 0,
                value: 0,
                netBenefit: 0,
              };

              return (
                <tr
                  key={month}
                  className="border-b last:border-0 hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-4 py-4 text-sm">
                    <span className="font-medium text-gray-900">{month}</span>
                  </td>
                  {/* Estimated Benefits */}
                  <td className="px-4 py-4 text-right text-sm">
                    <div className="space-y-1">
                      <span className="block font-medium text-gray-900">
                        {estimatedData.quantity} pièces
                      </span>
                      <span className="block text-xs text-gray-500">
                        ({Math.floor(estimatedData.quantity / 9)} cartons)
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-sm">
                    <span className="font-medium text-green-600">
                      {estimatedData.netBenefit.toLocaleString("fr-DZ")} DZD
                    </span>
                  </td>
                  {/* Real Benefits */}
                  <td className="px-4 py-4 text-right text-sm">
                    <div className="space-y-1">
                      <span className="block font-medium text-gray-900">
                        {realData.quantity} pièces
                      </span>
                      <span className="block text-xs text-gray-500">
                        ({Math.floor(realData.quantity / 9)} cartons)
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-sm">
                    <span className="font-medium text-blue-600">
                      {realData.netBenefit.toLocaleString("fr-DZ")} DZD
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      <div className="px-4 py-3 bg-gray-50 border-t">
        <div className="flex justify-between items-center text-xs text-gray-600">
          <span>Total: {sortedMonths.length} mois</span>
          <div className="flex gap-4">
            <span>
              Estimé total:{" "}
              <span className="font-medium text-green-600">
                {Object.values(monthlyBenefits)
                  .reduce((sum, data) => sum + data.netBenefit, 0)
                  .toLocaleString("fr-DZ")}{" "}
                DZD
              </span>
            </span>
            <span>
              Réel total:{" "}
              <span className="font-medium text-blue-600">
                {Object.values(monthlyPaidBenefits)
                  .reduce((sum, data) => sum + data.netBenefit, 0)
                  .toLocaleString("fr-DZ")}{" "}
                DZD
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
