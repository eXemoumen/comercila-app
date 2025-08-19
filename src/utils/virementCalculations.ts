import type { Sale } from "@/types/index";

/**
 * Calculate the virement period based on unpaid sales
 * @param sales Array of all sales
 * @returns Object containing virement period information
 */
export function calculateVirementPeriod(sales: Sale[]) {
  const unpaidSales = sales.filter(sale => !sale.isPaid);
  
  if (unpaidSales.length === 0) {
    return {
      period: "mois en cours",
      monthsBack: 0,
      oldestDate: null,
      hasUnpaidSales: false
    };
  }

  const dates = unpaidSales.map(sale => new Date(sale.date).getTime());
  const oldestDate = new Date(Math.min(...dates));
  const currentDate = new Date();
  
  // Calculate months difference
  const monthsDifference = (currentDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  
  let period: string;
  if (monthsDifference > 6) {
    period = "6+ mois";
  } else if (monthsDifference > 4) {
    period = "4-6 mois";
  } else if (monthsDifference > 2) {
    period = "2-4 mois";
  } else {
    period = "1-2 mois";
  }

  return {
    period,
    monthsBack: Math.ceil(monthsDifference),
    oldestDate: oldestDate.toISOString(),
    hasUnpaidSales: true
  };
}

/**
 * Calculate benefits for a specific time period
 * @param sales Array of all sales
 * @param startDate Start date for the period
 * @param endDate End date for the period
 * @returns Object containing period calculations
 */
export function calculateBenefitsForPeriod(sales: Sale[], startDate: Date, endDate: Date) {
  const periodSales = sales.filter((sale) => {
    const saleDate = new Date(sale.date);
    return saleDate >= startDate && saleDate <= endDate;
  });

  const totalQuantity = periodSales.reduce((acc, sale) => acc + sale.quantity, 0);
  const totalRevenue = periodSales.reduce((acc, sale) => acc + sale.totalValue, 0);
  
  // Calculate profit based on the actual pricePerUnit from sales
  const totalProfit = periodSales.reduce((acc, sale) => {
    const benefitPerUnit =
      sale.pricePerUnit === 180 ? 25 : sale.pricePerUnit === 166 ? 17 : 0;
    return acc + sale.quantity * benefitPerUnit;
  }, 0);

  // Calculate profit from paid sales only for the period
  const paidProfit = periodSales.reduce((acc, sale) => {
    if (sale.isPaid && sale.paymentDate) {
      // For paid sales, check if the payment was made within the period
      const paymentDate = new Date(sale.paymentDate);
      if (paymentDate >= startDate && paymentDate <= endDate) {
        const benefitPerUnit =
          sale.pricePerUnit === 180 ? 25 : sale.pricePerUnit === 166 ? 17 : 0;
        return acc + sale.quantity * benefitPerUnit;
      }
    }
    return acc;
  }, 0);

  // Calculate supplier payment amount for the period
  const totalSupplierPayment = periodSales.reduce((acc, sale) => {
    const supplierCostPerUnit =
      sale.pricePerUnit === 180 ? 155 : sale.pricePerUnit === 166 ? 149 : 0;
    return acc + sale.quantity * supplierCostPerUnit;
  }, 0);

  return {
    quantity: totalQuantity,
    revenue: totalRevenue,
    profit: totalProfit,
    paidProfit: paidProfit,
    supplierPayment: totalSupplierPayment
  };
}

/**
 * Determine if supplier payment can be returned
 * @param sales Array of all sales
 * @returns Object containing supplier return information
 */
export function calculateSupplierReturn(sales: Sale[]) {
  const unpaidSales = sales.filter(sale => !sale.isPaid);
  const paidSales = sales.filter(sale => sale.isPaid);
  
  const totalUnpaid = unpaidSales.reduce((sum, sale) => sum + (sale.remainingAmount || 0), 0);
  const totalPaid = paidSales.reduce((sum, sale) => sum + (sale.totalValue - (sale.remainingAmount || 0)), 0);
  
  // Only return money to supplier when ALL virements are completed
  const canReturnToSupplier = unpaidSales.length === 0;
  const supplierReturnAmount = canReturnToSupplier ? totalPaid : 0;
  
  return {
    totalUnpaid,
    totalPaid,
    canReturnToSupplier,
    supplierReturnAmount,
    unpaidSalesCount: unpaidSales.length,
    paidSalesCount: paidSales.length
  };
}

/**
 * Get the appropriate time period for dashboard calculations based on virement status
 * @param sales Array of all sales
 * @returns Object containing period data and label
 */
export function getDashboardPeriod(sales: Sale[]) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Calculate current month's data
  const currentMonthData = calculateBenefitsForPeriod(
    sales,
    new Date(currentYear, currentMonth, 1),
    new Date(currentYear, currentMonth + 1, 0)
  );

  // Calculate data for the last 4 months (typical virement period)
  const fourMonthsAgo = new Date(currentYear, currentMonth - 3, 1);
  const lastFourMonthsData = calculateBenefitsForPeriod(
    sales,
    fourMonthsAgo,
    currentDate
  );

  // Calculate data for the last 6 months (extended virement period)
  const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1);
  const lastSixMonthsData = calculateBenefitsForPeriod(
    sales,
    sixMonthsAgo,
    currentDate
  );

  // Determine which period to use based on virement status
  const virementInfo = calculateVirementPeriod(sales);
  
  let displayData;
  let periodLabel = "";

  if (virementInfo.hasUnpaidSales) {
    if (virementInfo.monthsBack > 4) {
      // Use 6 months if virements go back more than 4 months
      displayData = lastSixMonthsData;
      periodLabel = "6 mois";
    } else {
      // Use 4 months for typical virement period
      displayData = lastFourMonthsData;
      periodLabel = "4 mois";
    }
  } else {
    // If all sales are paid, use current month data
    displayData = currentMonthData;
    periodLabel = "mois en cours";
  }

  return {
    displayData,
    periodLabel,
    currentMonth: currentMonthData,
    lastFourMonths: lastFourMonthsData,
    lastSixMonths: lastSixMonthsData,
    virementInfo
  };
} 