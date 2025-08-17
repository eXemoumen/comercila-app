// Script to check and clear Supabase database
// Run this in the browser console to see what's in the database

(async function () {
    console.log("🔍 Checking Supabase database...");

    // Import supabase
    const { supabase } = await import("/src/lib/supabase.js");

    // Check fragrance_stock table
    console.log("📊 Checking fragrance_stock table:");
    const { data: fragranceData, error: fragranceError } = await supabase
        .from("fragrance_stock")
        .select("*");

    if (fragranceError) {
        console.error("Error fetching fragrance stock:", fragranceError);
    } else {
        console.log("Fragrance stock data:", fragranceData);
        const total = fragranceData?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        console.log("Total stock from fragrances:", total);
    }

    // Check stock_history table
    console.log("📈 Checking stock_history table:");
    const { data: historyData, error: historyError } = await supabase
        .from("stock_history")
        .select("*")
        .order('date', { ascending: false })
        .limit(5);

    if (historyError) {
        console.error("Error fetching stock history:", historyError);
    } else {
        console.log("Recent stock history:", historyData);
    }

    // Option to clear all data
    console.log("🗑️ To clear all data, run: clearAllData()");

    window.clearAllData = async function () {
        console.log("Clearing all data...");

        // Clear fragrance stock
        await supabase.from("fragrance_stock").delete().neq('fragrance_id', '');
        console.log("✅ Cleared fragrance_stock");

        // Clear stock history
        await supabase.from("stock_history").delete().neq('id', '');
        console.log("✅ Cleared stock_history");

        // Clear sales
        await supabase.from("sales").delete().neq('id', '');
        console.log("✅ Cleared sales");

        // Clear orders
        await supabase.from("orders").delete().neq('id', '');
        console.log("✅ Cleared orders");

        // Clear payments
        await supabase.from("payments").delete().neq('id', '');
        console.log("✅ Cleared payments");

        console.log("🎉 All data cleared! Reloading page...");
        window.location.reload();
    };
})();