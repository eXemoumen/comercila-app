require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function syncFragranceStockWithHistory() {
  console.log("🔄 Syncing fragrance stock with stock history...");

  // Get all stock history records ordered by date
  const { data: history, error: historyError } = await supabase
    .from("stock_history")
    .select("*")
    .order("date", { ascending: true });

  if (historyError) {
    console.error("❌ Error fetching stock history:", historyError);
    return;
  }

  console.log(`📊 Processing ${history.length} stock history records...`);

  // Initialize fragrance stock tracking
  const fragranceStock = {};

  // Process each history record
  history.forEach((record, index) => {
    if (record.fragrance_distribution) {
      console.log(
        `📝 Processing record ${index + 1}: ${record.type} ${
          record.quantity
        } cartons`
      );

      // Update fragrance stock based on the distribution
      Object.entries(record.fragrance_distribution).forEach(
        ([fragranceId, quantity]) => {
          if (!fragranceStock[fragranceId]) {
            fragranceStock[fragranceId] = 0;
          }

          // Add or subtract based on the type
          if (record.type === "added") {
            fragranceStock[fragranceId] += Number(quantity);
          } else if (record.type === "removed") {
            fragranceStock[fragranceId] -= Number(quantity);
          } else if (record.type === "adjusted") {
            // For adjustments, we directly add the quantity (could be negative)
            fragranceStock[fragranceId] += Number(quantity);
          }
        }
      );
    }
  });

  console.log("📦 Final calculated fragrance stock:", fragranceStock);

  // Update the fragrance_stock table
  for (const [fragranceId, quantity] of Object.entries(fragranceStock)) {
    const { error } = await supabase
      .from("fragrance_stock")
      .update({
        quantity: Math.max(0, quantity), // Ensure non-negative
        updated_at: new Date().toISOString(),
      })
      .eq("fragrance_id", fragranceId);

    if (error) {
      console.error(`❌ Error updating fragrance ${fragranceId}:`, error);
    } else {
      console.log(
        `✅ Updated fragrance ${fragranceId} to ${Math.max(
          0,
          quantity
        )} cartons`
      );
    }
  }

  console.log("✅ Fragrance stock sync completed!");

  // Verify the update
  const { data: updatedStock, error: verifyError } = await supabase
    .from("fragrance_stock")
    .select("*")
    .order("name");

  if (verifyError) {
    console.error("Error verifying update:", verifyError);
    return;
  }

  console.log("\n📊 Updated fragrance stock:");
  updatedStock.forEach((item) => {
    console.log(`${item.name}: ${item.quantity} cartons`);
  });
}

// Run the sync
syncFragranceStockWithHistory();
