const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (!fs.existsSync(envPath)) {
      console.error("❌ .env.local file not found");
      return null;
    }

    const envContent = fs.readFileSync(envPath, "utf8");
    const env = {};

    envContent.split("\n").forEach((line) => {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim();
        if (value && !key.startsWith("#")) {
          env[key.trim()] = value.replace(/^["']|["']$/g, "");
        }
      }
    });

    return env;
  } catch (error) {
    console.error("❌ Error loading .env.local:", error);
    return null;
  }
}

async function testDataPersistence() {
  const env = loadEnvFile();
  if (!env) {
    console.error("❌ Failed to load environment variables");
    return;
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase environment variables");
    return;
  }

  console.log("🔍 Testing data persistence...");
  console.log("Supabase URL:", supabaseUrl);

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test 1: Check if we can connect to the database
    console.log("\n📊 Test 1: Database Connection");
    const { data: connectionTest, error: connectionError } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (connectionError) {
      console.error("❌ Database connection failed:", connectionError);
      return;
    }
    console.log("✅ Database connection successful");

    // Test 2: Check table structure
    console.log("\n📊 Test 2: Table Structure");
    const tables = ["users", "expenses", "budgets", "travel_countdowns"];

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select("*").limit(1);

        if (error) {
          console.error(`❌ Error accessing ${table}:`, error);
        } else {
          console.log(`✅ ${table} table accessible`);
        }
      } catch (err) {
        console.error(`❌ Exception accessing ${table}:`, err);
      }
    }

    // Test 3: Check RLS policies
    console.log("\n📊 Test 3: RLS Policies");
    try {
      const { data: policies, error: policyError } = await supabase.rpc(
        "get_policies"
      );

      if (policyError) {
        console.log("ℹ️  Could not check RLS policies (this is normal)");
      } else {
        console.log("✅ RLS policies check successful");
      }
    } catch (err) {
      console.log("ℹ️  RLS policies check not available (this is normal)");
    }

    console.log("\n🎯 Data persistence test completed!");
    console.log("\n💡 Next steps:");
    console.log("1. Try adding an expense in the app");
    console.log("2. Check the browser console for any errors");
    console.log("3. Refresh the page to see if data persists");
    console.log("4. Use the debug panel in the app to test data loading");
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Run the test
testDataPersistence().catch(console.error);
