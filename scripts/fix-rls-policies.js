#!/usr/bin/env node

/**
 * Script to fix RLS policies in Supabase
 * This fixes the 406 errors when trying to access personal data (travel_profile_id IS NULL)
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load environment variables
function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf8");
      const envVars = {};

      envContent.split("\n").forEach((line) => {
        const [key, ...valueParts] = line.split("=");
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join("=").trim();
        }
      });

      return envVars;
    }
  } catch (error) {
    console.error("Error loading .env.local:", error.message);
  }
  return {};
}

const env = loadEnvFile();

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables!");
  console.error("Please check your .env.local file has:");
  console.error("NEXT_PUBLIC_SUPABASE_URL=your_project_url");
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLSPolicies() {
  console.log("🔧 Fixing RLS Policies in Supabase...\n");

  try {
    // Read the migration file
    const migrationPath = path.join(
      process.cwd(),
      "supabase",
      "migrations",
      "005_fix_rls_policies.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("📋 Running RLS policy fix migration...");

    // Execute the migration
    const { data, error } = await supabase.rpc("exec_sql", {
      sql: migrationSQL,
    });

    if (error) {
      console.error("❌ Error running migration:", error);

      // Try alternative approach - run SQL directly
      console.log("\n🔄 Trying alternative approach...");
      console.log("Please run this SQL in your Supabase SQL Editor:");
      console.log("\n" + "=".repeat(80));
      console.log(migrationSQL);
      console.log("=".repeat(80));

      return;
    }

    console.log("✅ RLS policies updated successfully!");
    console.log("🎉 The app should now work without 406 errors!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.log(
      "\n🔄 Please run the migration manually in Supabase SQL Editor:"
    );
    console.log("1. Go to your Supabase dashboard");
    console.log("2. Navigate to SQL Editor");
    console.log(
      "3. Copy and paste the contents of: supabase/migrations/005_fix_rls_policies.sql"
    );
    console.log('4. Click "Run"');
  }
}

// Check if we can connect to Supabase
async function testConnection() {
  console.log("🔍 Testing Supabase connection...");

  try {
    const { data, error } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (error) {
      console.error("❌ Connection failed:", error.message);
      return false;
    }

    console.log("✅ Connected to Supabase successfully!");
    return true;
  } catch (error) {
    console.error("❌ Connection error:", error.message);
    return false;
  }
}

async function main() {
  console.log("🚀 Supabase RLS Policy Fix Tool\n");

  const isConnected = await testConnection();
  if (!isConnected) {
    console.log(
      "\n💡 Make sure your Supabase project is running and accessible."
    );
    process.exit(1);
  }

  await fixRLSPolicies();
}

main().catch(console.error);
