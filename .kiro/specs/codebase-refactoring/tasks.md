# Implementation Plan

- [x] 1. Create utility functions for business logic and calculations





  - Extract all calculation logic from the main dashboard component
  - Create pure functions for profit calculations, data transformations, and formatting
  - Add comprehensive TypeScript types and JSDoc documentation
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 1.1 Create dashboard calculations utility


  - Write functions for monthly sales calculations, profit calculations, and supplier payment calculations
  - Implement functions to calculate paid profit and monthly benefits from sales data
  - Add unit tests for all calculation functions
  - _Requirements: 4.1, 4.2_

- [x] 1.2 Create data transformation utilities


  - Write functions to transform sales data for charts and display
  - Implement fragrance stock data transformations for pie charts
  - Create currency and quantity formatting functions
  - _Requirements: 4.2, 4.3_

- [x] 1.3 Create date utility functions


  - Write functions for date manipulation and formatting
  - Implement month/year formatting for French locale
  - Create functions for date filtering and sorting
  - _Requirements: 4.3, 4.4_

- [x] 1.4 Create business logic utilities


  - Extract profit per unit and supplier cost calculations
  - Implement carton/piece conversion functions
  - Create stock percentage calculation functions
  - _Requirements: 4.1, 4.2_

- [x] 2. Create custom hooks for state management





  - Extract complex state logic from components into reusable hooks
  - Implement data fetching hooks with loading states and error handling
  - Create navigation and UI state management hooks
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 2.1 Create useDashboardData hook


  - Extract dashboard data fetching and calculation logic
  - Implement loading states, error handling, and data refresh functionality
  - Add automatic data refresh and event listener management
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 2.2 Create useNavigation hook


  - Extract navigation state management from main component
  - Implement tab switching, mobile menu, and pre-fill data handling
  - Add localStorage integration for tab persistence
  - _Requirements: 3.1, 3.4_

- [x] 2.3 Create useMigration hook


  - Extract migration modal state and logic
  - Implement migration status checking and completion handling
  - Add proper cleanup and data refresh after migration
  - _Requirements: 3.1, 3.3_

- [x] 2.4 Create useDataRefresh hook


  - Extract data refresh logic and event handling
  - Implement periodic data updates and manual refresh functionality
  - Add dependency tracking for selective data updates
  - _Requirements: 3.2, 3.3_

- [x] 3. Extract metric card components





  - Create reusable metric card components for dashboard statistics
  - Implement proper TypeScript interfaces and styling consistency
  - Add animation and responsive design features
  - _Requirements: 2.1, 2.2, 2.3, 5.3_

- [x] 3.1 Create base MetricCard component


  - Write reusable metric card component with configurable colors and icons
  - Implement proper TypeScript props interface with gradient backgrounds
  - Add hover effects and animation transitions
  - _Requirements: 2.1, 2.2, 5.3_

- [x] 3.2 Create specialized metric cards


  - Create SalesMetricCard, ProfitMetricCard, StockMetricCard components
  - Implement SupplierPaymentCard with specific business logic display
  - Add proper data formatting and percentage calculations
  - _Requirements: 2.1, 2.2, 7.2_

- [x] 3.3 Create MetricsGrid component


  - Write grid layout component to organize metric cards
  - Implement responsive grid system for different screen sizes
  - Add proper spacing and alignment for metric cards
  - _Requirements: 2.2, 2.3, 5.3_

- [x] 4. Extract chart components





  - Create reusable chart components for sales trends and analytics
  - Implement proper data formatting and responsive design
  - Add interactive features and proper accessibility
  - _Requirements: 2.1, 2.2, 5.1, 5.3_

- [x] 4.1 Create SalesChart component


  - Extract 7-day sales trend chart into reusable component
  - Implement proper data transformation and responsive container
  - Add tooltip formatting and accessibility features
  - _Requirements: 2.1, 2.2, 7.2_

- [x] 4.2 Create MonthlyBenefitsChart component


  - Extract monthly benefits bar chart into separate component
  - Implement proper month sorting and data filtering for last 6 months
  - Add French locale formatting and proper chart styling
  - _Requirements: 2.1, 2.2, 7.2_

- [x] 4.3 Create FragranceStockChart component


  - Extract fragrance stock pie chart into reusable component
  - Implement proper color mapping and label positioning
  - Add responsive design and proper data handling
  - _Requirements: 2.1, 2.2, 7.2_

- [x] 4.4 Create MonthlyHistoryTable component


  - Extract monthly history table into separate component
  - Implement proper data sorting and formatting
  - Add responsive table design and proper styling
  - _Requirements: 2.1, 2.2, 7.2_

- [x] 5. Create dashboard overview component





  - Combine metric cards and charts into cohesive dashboard overview
  - Implement proper layout and spacing for all dashboard elements
  - Add loading states and error handling for the overview section
  - _Requirements: 2.1, 2.2, 5.1, 7.1_

- [x] 5.1 Create DashboardOverview component


  - Write main dashboard overview component that combines all dashboard elements
  - Implement proper props interface for dashboard data and navigation
  - Add proper component composition and layout structure
  - _Requirements: 2.1, 2.2, 5.1_



- [x] 5.2 Integrate metrics and charts in overview
  - Combine MetricsGrid and all chart components in dashboard overview
  - Implement proper data flow and prop passing to child components
  - Add proper spacing and responsive layout for all elements
  - _Requirements: 2.2, 5.1, 7.2_

- [x] 6. Extract page components













  - Create separate components for each major page/tab in the application
  - Implement proper navigation and state management for each page
  - Add consistent styling and layout patterns across pages
  - _Requirements: 2.1, 2.2, 6.1, 6.2_

- [x] 6.1 Create SupermarketsPage component





  - Extract supermarkets management functionality into separate component
  - Implement proper supermarket listing, editing, and navigation
  - Add proper TypeScript interfaces and error handling
  - _Requirements: 2.1, 2.2, 7.1_

- [x] 6.2 Create OrdersPage component


  - Extract orders management functionality into separate component
  - Implement order listing, completion, and deletion functionality
  - Add proper state management and data refresh handling
  - _Requirements: 2.1, 2.2, 7.1_

- [x] 6.3 Create AddSalePage component


  - Extract sale creation functionality into separate component
  - Implement pre-fill data handling and form validation
  - Add proper integration with order completion workflow
  - _Requirements: 2.1, 2.2, 7.1_

- [x] 6.4 Create StockPage component


  - Extract stock management functionality into separate component
  - Implement stock history display and stock adjustment features
  - Add proper data visualization and management interfaces
  - _Requirements: 2.1, 2.2, 7.1_

- [x] 7. Create navigation components





  - Extract navigation logic into reusable components
  - Implement responsive navigation for desktop and mobile
  - Add proper accessibility and keyboard navigation support
  - _Requirements: 2.1, 2.2, 5.1, 6.1_

- [x] 7.1 Create NavigationTabs component


  - Extract tab navigation into reusable component
  - Implement proper active state management and styling
  - Add accessibility features and keyboard navigation
  - _Requirements: 2.1, 6.1, 6.3_

- [x] 7.2 Create MobileNavigation component

  - Extract mobile menu functionality into separate component
  - Implement proper mobile-responsive navigation drawer
  - Add proper animation and touch interactions
  - _Requirements: 2.1, 2.2, 5.1_

- [x] 8. Create layout components





  - Create main layout component to structure the entire dashboard
  - Implement proper responsive design and mobile-first approach
  - Add consistent spacing and styling patterns
  - _Requirements: 2.1, 2.2, 5.1, 6.2_

- [x] 8.1 Create DashboardLayout component


  - Write main layout component that structures the entire dashboard
  - Implement proper header, navigation, and content area layout
  - Add responsive design patterns and mobile menu integration
  - _Requirements: 2.1, 5.1, 6.2_

- [x] 8.2 Integrate navigation in layout


  - Combine NavigationTabs and MobileNavigation in dashboard layout
  - Implement proper navigation state management and responsive behavior
  - Add proper styling and spacing for navigation elements
  - _Requirements: 2.2, 5.1, 6.2_

- [x] 9. Refactor main dashboard component





  - Reduce main page.tsx to orchestration logic only
  - Implement proper component composition using extracted components
  - Add error boundaries and loading states for the entire application
  - _Requirements: 1.1, 1.2, 1.3, 5.1, 7.1_

- [x] 9.1 Update main page.tsx component


  - Replace inline logic with custom hooks and extracted components
  - Implement proper component composition and data flow
  - Reduce file size to under 200 lines while maintaining all functionality
  - _Requirements: 1.1, 1.2, 1.3, 7.1_

- [x] 9.2 Add error boundaries and loading states


  - Implement error boundary components for graceful error handling
  - Add proper loading states and skeleton components
  - Add error recovery mechanisms and user feedback
  - _Requirements: 5.1, 5.2, 7.3_

- [x] 10. Add performance optimizations





  - Implement React.memo, useMemo, and useCallback where appropriate
  - Add code splitting and lazy loading for non-critical components
  - Optimize bundle size and runtime performance
  - _Requirements: 5.2, 5.3_

- [x] 10.1 Add React performance optimizations


  - Implement React.memo for components that don't need frequent re-renders
  - Add useMemo for expensive calculations and useCallback for event handlers
  - Optimize component re-rendering and memory usage
  - _Requirements: 5.2_

- [x] 10.2 Implement code splitting and lazy loading


  - Add lazy loading for page components and non-critical features
  - Implement proper loading fallbacks and error boundaries
  - Optimize bundle size and initial load performance
  - _Requirements: 5.2_

- [ ] 11. Add comprehensive testing
  - Write unit tests for all utility functions and custom hooks
  - Add integration tests for component interactions
  - Implement end-to-end tests for critical user workflows
  - _Requirements: 7.3_

- [ ] 11.1 Write unit tests for utilities and hooks
  - Create comprehensive test suites for all utility functions
  - Write tests for custom hooks using React Testing Library
  - Add edge case testing and error scenario coverage
  - _Requirements: 7.3_

- [ ] 11.2 Add integration and component tests
  - Write integration tests for component interactions and data flow
  - Test navigation, state management, and user interactions
  - Add visual regression tests for UI components
  - _Requirements: 7.3_

- [ ] 12. Final verification and cleanup
  - Verify all existing functionality works identically to before refactoring
  - Remove any unused code and optimize imports
  - Update documentation and add proper code comments
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 12.1 Verify functionality preservation
  - Test all dashboard features to ensure identical behavior
  - Verify data calculations, navigation, and user interactions work correctly
  - Check mobile responsiveness and cross-browser compatibility
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 12.2 Code cleanup and documentation
  - Remove unused imports, variables, and dead code
  - Add proper JSDoc comments and TypeScript documentation
  - Update README and component documentation
  - _Requirements: 6.3, 6.4_