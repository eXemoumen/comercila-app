// Force Supabase Usage Script
// This script forces the app to use Supabase instead of local storage

console.log("🚀 Forcing Supabase usage...");

// Force all data to use Supabase
localStorage.setItem("supermarket_migration_done", "true");
localStorage.setItem("sales_migration_done", "true");
localStorage.setItem("orders_migration_done", "true");
localStorage.setItem("stock_migration_done", "true");
localStorage.setItem("fragrance_stock_migration_done", "true");
localStorage.setItem("full_migration_complete", "true");

console.log("✅ Migration flags set to force Supabase usage");

// Add some initial stock data to Supabase (if needed)
console.log("📊 Ready to use Supabase for all data operations");

// Instructions for the user:
console.log(`
🎯 To ensure Supabase is used:

1. Make sure you have internet connection
2. Your Supabase credentials are in .env file
3. The app will now prioritize Supabase over local storage
4. All data operations will go to Supabase first

📱 Test the app now - it should use Supabase data!
`);
