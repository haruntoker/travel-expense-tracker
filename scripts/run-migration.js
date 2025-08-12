#!/usr/bin/env node

/**
 * Database Migration Runner
 * This script helps you run the database migration in Supabase
 */

const fs = require("fs");
const path = require("path");

console.log("🗄️  Database Migration Runner");
console.log("==============================\n");

// Check if migration file exists
const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/001_initial_schema.sql"
);
if (!fs.existsSync(migrationPath)) {
  console.error("❌ Migration file not found!");
  console.log("Expected path:", migrationPath);
  process.exit(1);
}

console.log("✅ Migration file found");
console.log("📁 Path:", migrationPath);

// Read and display the migration content
const migrationContent = fs.readFileSync(migrationPath, "utf8");
console.log("\n📋 Migration SQL Preview (first 500 chars):");
console.log("==========================================");
console.log(migrationContent.substring(0, 500) + "...\n");

console.log("🔧 To run this migration:");
console.log("=====================================");
console.log("1. Go to your Supabase Dashboard:");
console.log("   https://supabase.com/dashboard/project/eavnpymdppewgrrtaaau");
console.log("\n2. Navigate to SQL Editor (left sidebar)");
console.log("\n3. Copy the entire contents of:");
console.log("   supabase/migrations/001_initial_schema.sql");
console.log("\n4. Paste into the SQL Editor");
console.log('\5. Click "Run" to execute the migration');
console.log("\n6. Check Table Editor to verify tables are created");

console.log("\n⚠️  Important Notes:");
console.log("- This will create all necessary tables and RLS policies");
console.log("- Existing data will be preserved");
console.log("- The migration is idempotent (safe to run multiple times)");
console.log("- RLS policies will be automatically configured");

console.log("\n✅ After running the migration:");
console.log("- Your authentication should work properly");
console.log("- The infinite loading loop should stop");
console.log("- You should be able to access the dashboard");

console.log("\n🔗 Migration file location:");
console.log(migrationPath);
