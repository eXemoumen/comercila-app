"use client";

interface MonthlyData {
    quantity: number;
    value: number;
    netBenefit: number;
}

interface MonthlyHistoryTableProps {
    monthlyBenefits: Record<string, MonthlyData>;
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

function sortMonthlyData(data: Record<string, MonthlyData>) {
    return Object.entries(data).sort((a, b) => {
        // Extract month and year from the formatted strings
        const monthA = a[0].split(" ")[0].toLowerCase();
        const yearA = a[0].split(" ")[1];
        const monthB = b[0].split(" ")[0].toLowerCase();
        const yearB = b[0].split(" ")[1];

        // Compare years first
        if (yearA !== yearB) {
            return parseInt(yearA) - parseInt(yearB);
        }

        // If years are equal, compare months
        return (monthNamesMap[monthA] || 0) - (monthNamesMap[monthB] || 0);
    });
}

export function MonthlyHistoryTable({
    monthlyBenefits,
    className = ""
}: MonthlyHistoryTableProps) {
    const sortedData = sortMonthlyData(monthlyBenefits);

    if (sortedData.length === 0) {
        return (
            <div className={`bg-white rounded-xl shadow-md border-none overflow-hidden ${className}`}>
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
        <div className={`bg-white rounded-xl shadow-md border-none overflow-hidden ${className}`}>
            <div className="p-3 border-b">
                <h3 className="text-sm font-medium text-gray-700">
                    Historique Mensuel
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full" role="table" aria-label="Historique mensuel des ventes">
                    <thead>
                        <tr className="bg-gray-50">
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                scope="col"
                            >
                                Mois
                            </th>
                            <th
                                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                scope="col"
                            >
                                Ventes
                            </th>
                            <th
                                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                scope="col"
                            >
                                Bénéfice
                            </th>
                            <th
                                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                scope="col"
                            >
                                Retour Fournisseur
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedData.map(([month, data]) => {
                            // Calculation for supplier payment
                            const supplierPayment = data.value - data.netBenefit;

                            return (
                                <tr
                                    key={month}
                                    className="border-b last:border-0 hover:bg-gray-50 transition-colors duration-150"
                                >
                                    <td className="px-4 py-4 text-sm">
                                        <span className="font-medium text-gray-900">{month}</span>
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm">
                                        <div className="space-y-1">
                                            <span className="block font-medium text-gray-900">
                                                {data.quantity} pièces
                                            </span>
                                            <span className="block text-xs text-gray-500">
                                                ({Math.floor(data.quantity / 9)} cartons)
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm">
                                        <span className="font-medium text-green-600">
                                            {data.netBenefit.toLocaleString("fr-DZ")} DZD
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm">
                                        <span className="font-medium text-red-600">
                                            {supplierPayment.toLocaleString("fr-DZ")} DZD
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
                    <span>Total: {sortedData.length} mois</span>
                    <span>
                        Bénéfice total: {" "}
                        <span className="font-medium text-green-600">
                            {sortedData
                                .reduce((sum, [, data]) => sum + data.netBenefit, 0)
                                .toLocaleString("fr-DZ")} DZD
                        </span>
                    </span>
                </div>
            </div>
        </div>
    );
}