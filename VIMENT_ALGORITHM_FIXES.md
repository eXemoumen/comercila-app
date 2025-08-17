# Virement Algorithm Fixes

## Overview

This document outlines the fixes implemented to resolve the virement (transfer) algorithm issues in the TopFresh application.

## Issues Identified and Fixed

### 1. **Benefit Calculation Period Problem**

**Issue**: The system was calculating `benefice etme` (estimated benefit) and `benefice reel` (real/paid benefit) based only on the current month's sales, even when virements were spread over multiple months.

**Fix**:

- Implemented dynamic period calculation based on virement status
- When virements are in progress, benefits are calculated for the appropriate period (4 months, 6 months, etc.)
- When all virements are completed, benefits return to current month calculation

### 2. **Supplier Payment Return Logic**

**Issue**: The system didn't properly handle when to return money to suppliers. It should only return money when ALL virements for a specific sale are completed.

**Fix**:

- Implemented strict supplier return logic: money is only returned when `unpaidSales.length === 0`
- Added clear visual indicators showing when supplier returns are possible
- Supplier return amount is calculated only from fully paid sales

### 3. **Virement Period Handling**

**Issue**: When virements were spread over multiple months, the system didn't account for the actual virement period in calculations.

**Fix**:

- Added automatic period detection based on oldest unpaid sale date
- Implemented period categorization: "1-2 mois", "2-4 mois", "4-6 mois", "6+ mois"
- Dashboard automatically adjusts to show benefits for the correct virement period

## Technical Implementation

### New Utility Functions (`src/utils/virementCalculations.ts`)

#### `calculateVirementPeriod(sales: Sale[])`

- Determines the virement period based on unpaid sales
- Returns period label and oldest unpaid date
- Automatically categorizes periods (1-2, 2-4, 4-6, 6+ months)

#### `calculateBenefitsForPeriod(sales: Sale[], startDate: Date, endDate: Date)`

- Calculates benefits for a specific time period
- Handles profit, paid profit, and supplier payment calculations
- Filters sales by date range

#### `calculateSupplierReturn(sales: Sale[])`

- Determines if supplier payment can be returned
- Only allows returns when ALL virements are completed
- Calculates return amount from fully paid sales

#### `getDashboardPeriod(sales: Sale[])`

- Main function for determining dashboard period
- Automatically selects appropriate period based on virement status
- Returns period data and label for display

### Updated Dashboard Logic (`src/hooks/useDashboardData.ts`)

- Automatically detects virement status
- Calculates benefits for appropriate time period
- Passes virement period information to UI components
- Updates calculations when virement status changes

### Enhanced VirementsPage (`src/components/VirementsPage.tsx`)

- Shows virement period information
- Displays supplier return status
- Provides clear visual feedback on virement progress
- Tracks oldest unpaid sale date

### Updated UI Components

- **ProfitMetricCard**: Shows period information and adjusts title accordingly
- **PaidProfitMetricCard**: Displays period-specific paid benefit information
- **MetricsGrid**: Passes virement period to profit cards

## Business Logic Rules

### Virement Period Detection

1. **No unpaid sales**: Use current month data
2. **Unpaid sales < 4 months old**: Use 4-month period data
3. **Unpaid sales > 4 months old**: Use 6-month period data

### Supplier Payment Returns

1. **Never return money** while any virements are pending
2. **Only return money** when ALL virements are completed
3. **Return amount** = Total amount from fully paid sales

### Benefit Calculations

1. **Estimated Benefit**: Total profit for the virement period
2. **Real Benefit**: Only profit from paid sales within the period
3. **Period**: Automatically adjusted based on virement status

## User Experience Improvements

### Dashboard Display

- Clear indication of which period benefits are calculated for
- Automatic adjustment when virement status changes
- Visual feedback on virement progress

### Virements Page

- Comprehensive virement status overview
- Supplier return eligibility indicators
- Period information display
- Progress tracking

### Payment Processing

- Real-time status updates
- Automatic period recalculation
- Clear supplier return guidance

## Testing Scenarios

### Scenario 1: Current Month Only

- All sales paid → Benefits shown for current month
- Period label: "mois en cours"

### Scenario 2: 4-Month Virement

- Unpaid sales from 3 months ago → Benefits shown for 4-month period
- Period label: "4 mois"
- Supplier returns blocked

### Scenario 3: Extended Virement

- Unpaid sales from 5 months ago → Benefits shown for 6-month period
- Period label: "6 mois"
- Supplier returns blocked

### Scenario 4: Virements Completed

- All sales paid → Benefits return to current month
- Period label: "mois en cours"
- Supplier returns enabled

## Benefits of the Fix

1. **Accurate Financial Reporting**: Benefits are now calculated for the correct time period
2. **Proper Supplier Management**: Money is only returned when appropriate
3. **Clear Business Logic**: Virement periods are automatically detected and displayed
4. **Improved User Experience**: Clear visual feedback on virement status
5. **Maintainable Code**: Centralized utility functions for virement calculations

## Future Enhancements

1. **Custom Period Selection**: Allow users to manually select calculation periods
2. **Advanced Analytics**: Track virement patterns and trends
3. **Supplier Payment Scheduling**: Plan future supplier payments based on virement projections
4. **Notification System**: Alert users when virements are completed and supplier returns are possible
