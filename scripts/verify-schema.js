#!/usr/bin/env node

/**
 * Verify Database Schema Script
 * This script verifies that all tables and columns are created correctly
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Simple env file reader
function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  const env = {};

  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join("=").trim();
    }
  });

  return env;
}

async function verifySchema() {
  console.log("🔍 Verifying Database Schema");
  console.log("=============================\n");

  const env = loadEnvFile();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing environment variables");
    console.log("Please check your .env.local file");
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test each table
    const tables = [
      "users",
      "travel_profiles", 
      "expenses",
      "budgets",
      "travel_countdowns"
    ];

    for (const tableName of tables) {
      console.log(`📋 Checking table: ${tableName}`);
      
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .limit(1);

        if (error) {
          if (error.code === "PGRST116") {
            console.log(`   ✅ Table exists (no rows yet)`);
          } else if (error.code === "42P01") {
            console.log(`   ❌ Table does not exist`);
          } else {
            console.log(`   ❌ Error: ${error.message}`);
          }
        } else {
          console.log(`   ✅ Table exists and accessible`);
        }
      } catch (err) {
        console.log(`   ❌ Error accessing table: ${err.message}`);
      }
    }

    // Test specific columns
    console.log("\n🔍 Testing specific columns...");
    
    try {
      // Test users table structure
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, created_at, updated_at")
        .limit(1);
      
      if (userError) {
        console.log("   ❌ Users table structure issue:", userError.message);
      } else {
        console.log("   ✅ Users table structure correct");
      }
    } catch (err) {
      console.log("   ❌ Error testing users table:", err.message);
    }

    try {
      // Test expenses table structure
      const { data: expenseData, error: expenseError } = await supabase
        .from("expenses")
        .select("id, user_id, travel_profile_id, category, amount, created_at, updated_at")
        .limit(1);
      
      if (expenseError) {
        console.log("   ❌ Expenses table structure issue:", expenseError.message);
      } else {
        console.log("   ✅ Expenses table structure correct");
      }
    } catch (err) {
      console.log("   ❌ Error testing expenses table:", err.message);
    }

    console.log("\n✅ Schema verification completed!");
    
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
  }
}

verifySchema().catch(console.error);
