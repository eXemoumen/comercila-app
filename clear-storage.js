// Script to clear localStorage and set migration flags
// Run this in the browser console

// Clear all old localStorage data
const keysToRemove = [
    'soap_sales',
    'soap_supermarkets',
    'soap_stock',
    'soap_orders',
    'soap_fragrances',
    'soap_fragrance_stock'
];

keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`Removed ${key}`);
});

// Set migration flags to force Supabase usage
localStorage.setItem('supermarket_migration_done', 'true');
localStorage.setItem('sales_migration_done', 'true');
localStorage.setItem('orders_migration_done', 'true');
localStorage.setItem('stock_migration_done', 'true');
localStorage.setItem('fragrance_stock_migration_done', 'true');
localStorage.setItem('full_migration_complete', 'true');

console.log('✅ localStorage cleared and migration flags set!');
console.log('✅ System will now use Supabase for all data');

// Also clear sessionStorage if needed
sessionStorage.clear();
console.log('✅ sessionStorage cleared!');

// Reload the page to apply changes
console.log('🔄 Reloading page to apply changes...');
window.location.reload();