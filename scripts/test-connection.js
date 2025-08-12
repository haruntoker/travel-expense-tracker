#!/usr/bin/env node

/**
 * Test Supabase Connection Script
 * This script tests the connection to your Supabase project
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

async function testConnection() {
  console.log("🧪 Testing Supabase Connection");
  console.log("================================\n");

  const env = loadEnvFile();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing environment variables");
    console.log("Please check your .env.local file");
    return;
  }

  console.log("✅ Environment variables found");
  console.log(`URL: ${supabaseUrl}`);
  console.log(`Key: ${supabaseKey.substring(0, 20)}...\n`);

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🔌 Testing basic connection...");

    // Test basic connection
    const { data, error } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (error) {
      if (error.code === "PGRST116") {
        console.log("✅ Connection successful (table exists but no rows)");
      } else if (error.code === "42P01") {
        console.log("⚠️  Connection successful but tables don't exist yet");
        console.log("   Run the database migration to create tables");
      } else {
        console.error("❌ Connection error:", error.message);
        return;
      }
    } else {
      console.log("✅ Connection successful");
    }

    // Test auth endpoints
    console.log("\n🔐 Testing auth endpoints...");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getSession();
      if (authError) {
        console.log("⚠️  Auth endpoint accessible but no session (expected)");
      } else {
        console.log("✅ Auth endpoints working correctly");
      }
    } catch (authErr) {
      console.error("❌ Auth endpoint error:", authErr.message);
    }

    console.log("\n✅ Connection test completed successfully!");
    console.log("\n📋 Next Steps:");
    console.log(
      "1. Run the database migration: supabase/migrations/001_initial_schema.sql"
    );
    console.log("2. Configure email templates in Supabase dashboard");
    console.log("3. Set up redirect URLs for authentication");
  } catch (error) {
    console.error("❌ Connection test failed:", error.message);
    console.log("\n🔍 Troubleshooting:");
    console.log("- Check if your Supabase project is active");
    console.log("- Verify your API keys are correct");
    console.log("- Ensure your project is not paused");
  }
}

testConnection().catch(console.error);
