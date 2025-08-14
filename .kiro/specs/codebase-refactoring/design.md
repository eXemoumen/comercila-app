# Design Document

## Overview

This design outlines a comprehensive refactoring strategy for the Comercila application to address the current complexity issues, particularly the 3,600+ line main dashboard component. The refactoring will follow React best practices, implement proper separation of concerns, and maintain all existing functionality while significantly improving maintainability.

## Architecture

### Current State Analysis

**Problems Identified:**
- `src/app/page.tsx`: 3,643 lines - contains entire dashboard logic
- `src/components/InvoiceModal.tsx`: 427 lines - complex invoice generation
- Multiple responsibilities mixed in single components
- Lack of custom hooks for state management
- Inline business logic mixed with UI components
- Poor component reusability

**Target Architecture:**
- Modular component architecture with single responsibilities
- Custom hooks for state management and business logic
- Utility functions for calculations and data transformations
- Clear separation between UI and business logic
- Reusable components with proper prop interfaces

### Component Hierarchy Design

```
src/app/page.tsx (< 200 lines)
├── DashboardLayout
├── NavigationTabs
├── DashboardContent
│   ├── DashboardOverview
│   │   ├── MetricsGrid
│   │   │   ├── SalesMetricCard
│   │   │   ├── ProfitMetricCard
│   │   │   ├── StockMetricCard
│   │   │   └── SupplierPaymentCard
│   │   ├── SalesChart
│   │   ├── MonthlyBenefitsChart
│   │   ├── MonthlyHistoryTable
│   │   └── FragranceStockChart
│   ├── SupermarketsPage
│   ├── OrdersPage
│   ├── AddSalePage
│   ├── StockPage
│   └── PendingPaymentsPage
└── MobileNavigation
```

## Components and Interfaces

### Core Layout Components

#### 1. DashboardLayout
```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  showMobileMenu: boolean;
  onToggleMobileMenu: () => void;
}
```

#### 2. NavigationTabs
```typescript
interface NavigationTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}
```

#### 3. MobileNavigation
```typescript
interface MobileNavigationProps {
  isOpen: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
}
```

### Dashboard Overview Components

#### 4. DashboardOverview
```typescript
interface DashboardOverviewProps {
  dashboardData: DashboardData;
  monthlyBenefits: Record<string, MonthlyData>;
  onNavigate: (tab: string) => void;
}
```

#### 5. MetricsGrid
```typescript
interface MetricsGridProps {
  metrics: {
    sales: MonthlySalesData;
    stock: number;
    supplierPayment: number;
  };
}
```

#### 6. Individual Metric Cards
```typescript
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  additionalInfo?: string;
  color: 'blue' | 'green' | 'amber' | 'purple' | 'red';
  icon?: React.ReactNode;
  percentage?: number;
}
```

#### 7. Chart Components
```typescript
interface SalesChartProps {
  data: Array<{ name: string; value: number }>;
  height?: number;
}

interface MonthlyBenefitsChartProps {
  data: Record<string, MonthlyData>;
  height?: number;
}

interface FragranceStockChartProps {
  data: Array<{ name: string; value: number; color: string }>;
  height?: number;
}
```

#### 8. MonthlyHistoryTable
```typescript
interface MonthlyHistoryTableProps {
  monthlyBenefits: Record<string, MonthlyData>;
}
```

### Page Components

#### 9. SupermarketsPage
```typescript
interface SupermarketsPageProps {
  onBack: () => void;
  onViewSupermarket: (id: string) => void;
}
```

#### 10. OrdersPage
```typescript
interface OrdersPageProps {
  onBack: () => void;
  onCompleteOrder: (order: Order) => void;
}
```

#### 11. AddSalePage
```typescript
interface AddSalePageProps {
  onBack: () => void;
  preFillData?: {
    supermarketId: string;
    quantity: number;
    orderId?: string;
  } | null;
}
```

#### 12. StockPage
```typescript
interface StockPageProps {
  onBack: () => void;
}
```

## Data Models

### Enhanced Type Definitions

```typescript
interface DashboardData {
  monthlySales: MonthlySalesData;
  salesData: Array<{ name: string; value: number }>;
  fragranceStock: Array<{ name: string; value: number; color: string }>;
}

interface MonthlySalesData {
  quantity: number;
  revenue: number;
  profit: number;
  stock: number;
  supplierPayment: number;
  paidProfit: number;
}

interface MonthlyData {
  quantity: number;
  value: number;
  netBenefit: number;
}
```

## Custom Hooks Design

### 1. useDashboardData
```typescript
interface UseDashboardDataReturn {
  dashboardData: DashboardData;
  monthlyBenefits: Record<string, MonthlyData>;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

function useDashboardData(): UseDashboardDataReturn
```

**Responsibilities:**
- Fetch and manage all dashboard data
- Handle loading states and errors
- Provide data refresh functionality
- Auto-refresh data periodically

### 2. useNavigation
```typescript
interface UseNavigationReturn {
  activeTab: string;
  showMobileMenu: boolean;
  setActiveTab: (tab: string) => void;
  toggleMobileMenu: () => void;
  navigateWithPreFill: (tab: string, data?: any) => void;
}

function useNavigation(): UseNavigationReturn
```

**Responsibilities:**
- Manage navigation state
- Handle tab switching
- Manage mobile menu state
- Handle navigation with pre-filled data

### 3. useMigration
```typescript
interface UseMigrationReturn {
  showMigrationModal: boolean;
  migrationChecked: boolean;
  handleMigrationComplete: () => void;
  handleMigrationClose: () => void;
}

function useMigration(): UseMigrationReturn
```

**Responsibilities:**
- Check migration status
- Handle migration modal state
- Manage migration completion

### 4. useDataRefresh
```typescript
interface UseDataRefreshReturn {
  refreshData: () => Promise<void>;
  isRefreshing: boolean;
}

function useDataRefresh(dependencies: any[]): UseDataRefreshReturn
```

**Responsibilities:**
- Handle data refresh logic
- Manage refresh state
- Listen for data change events

## Utility Functions Design

### 1. Dashboard Calculations (`src/utils/dashboardCalculations.ts`)
```typescript
export function calculateMonthlySales(sales: Sale[]): MonthlySalesData;
export function calculateMonthlyBenefits(sales: Sale[]): Record<string, MonthlyData>;
export function calculateSalesData(sales: Sale[], days: number): Array<{ name: string; value: number }>;
export function calculateSupplierPayment(sales: Sale[]): number;
export function calculatePaidProfit(sales: Sale[]): number;
```

### 2. Data Transformations (`src/utils/dataTransformations.ts`)
```typescript
export function transformSalesForChart(sales: Sale[]): Array<{ name: string; value: number }>;
export function transformFragranceStockForChart(stock: FragranceStock[]): Array<{ name: string; value: number; color: string }>;
export function transformMonthlyDataForChart(data: Record<string, MonthlyData>): Array<ChartData>;
export function formatCurrency(amount: number): string;
export function formatQuantity(quantity: number): { pieces: number; cartons: number };
```

### 3. Date Utilities (`src/utils/dateUtils.ts`)
```typescript
export function getCurrentMonth(): { month: number; year: number };
export function getLastNDays(n: number): Date[];
export function formatMonthYear(date: Date, locale: string): string;
export function isCurrentMonth(date: Date): boolean;
export function sortMonthlyData(data: Record<string, any>): Array<[string, any]>;
```

### 4. Business Logic (`src/utils/businessLogic.ts`)
```typescript
export function calculateProfitPerUnit(pricePerUnit: number): number;
export function calculateSupplierCostPerUnit(pricePerUnit: number): number;
export function convertCartonsToPieces(cartons: number): number;
export function convertPiecesToCartons(pieces: number): number;
export function calculateStockPercentage(currentStock: number, maxStock: number): number;
```

## Error Handling

### Error Boundary Implementation
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class DashboardErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
>
```

### Error Handling Strategy
- Implement error boundaries for each major section
- Graceful degradation for non-critical components
- User-friendly error messages
- Error logging for debugging

## Testing Strategy

### Unit Testing
- Test all utility functions with comprehensive test cases
- Test custom hooks with React Testing Library
- Test individual components in isolation
- Mock external dependencies (storage, API calls)

### Integration Testing
- Test component interactions
- Test data flow between components
- Test navigation and state management
- Test error scenarios

### Performance Testing
- Measure component render times
- Test with large datasets
- Verify memory usage improvements
- Test mobile performance

## Migration Strategy

### Phase 1: Extract Utility Functions
1. Create utility modules for calculations and transformations
2. Extract business logic functions
3. Update existing code to use new utilities
4. Add comprehensive tests

### Phase 2: Create Custom Hooks
1. Extract state management logic into hooks
2. Create data fetching hooks
3. Create navigation hooks
4. Update components to use new hooks

### Phase 3: Component Extraction
1. Extract metric cards and charts
2. Create page components
3. Extract layout components
4. Update main dashboard to use new components

### Phase 4: Optimization and Testing
1. Add error boundaries
2. Implement performance optimizations
3. Add comprehensive tests
4. Verify all functionality works correctly

## Performance Considerations

### React Optimizations
- Use `React.memo` for components that don't need frequent re-renders
- Implement `useMemo` for expensive calculations
- Use `useCallback` for event handlers passed to child components
- Lazy load non-critical components

### Bundle Size Optimization
- Code splitting for page components
- Tree shaking for unused utilities
- Optimize chart library imports
- Minimize component bundle sizes

### Memory Management
- Proper cleanup of event listeners
- Avoid memory leaks in custom hooks
- Optimize data structures
- Implement proper component unmounting

## Accessibility Considerations

- Maintain proper ARIA labels
- Ensure keyboard navigation works
- Preserve screen reader compatibility
- Maintain color contrast ratios
- Add proper focus management