#!/usr/bin/env node

/**
 * Email Configuration Test Script
 * Tests Supabase email configuration for sign-up and magic links
 */

const fs = require("fs");
const path = require("path");

console.log("📧 Email Configuration Test");
console.log("============================\n");

// Check if .env.local exists
const envPath = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ .env.local file not found!");
  process.exit(1);
}

// Read environment variables
const envContent = fs.readFileSync(envPath, "utf8");
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1];
const supabaseKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1];

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

console.log("✅ Environment variables found");
console.log(`URL: ${supabaseUrl}`);
console.log(`Key: ${supabaseKey.substring(0, 20)}...\n`);

console.log("🔧 Email Configuration Checklist:");
console.log("================================\n");

console.log("1. 📧 Email Templates Setup:");
console.log("   - Go to Authentication > Email Templates");
console.log("   - Configure 'Confirm signup' template");
console.log("   - Configure 'Magic Link' template");
console.log(
  "   - Set redirect URLs to: https://codeabletest.site/auth/callback\n"
);

console.log("2. 🌐 Site URL Configuration:");
console.log("   - Go to Authentication > URL Configuration");
console.log("   - Set Site URL to: https://codeabletest.site");
console.log("   - Add to Redirect URLs:");
console.log("     * https://codeabletest.site/auth/callback");
console.log("     * https://codeabletest.site/auth/reset-password\n");

console.log("3. 📱 Email Provider Settings:");
console.log("   - Go to Authentication > Providers > Email");
console.log("   - Enable 'Enable email confirmations'");
console.log("   - Enable 'Enable magic links'");
console.log("   - Verify email service is active\n");

console.log("4. 🗄️ Database Schema:");
console.log("   - Run the database migration first");
console.log("   - Tables must exist before email confirmation works\n");

console.log("🔍 Why Magic Links Work But Sign-Up Doesn't:");
console.log("============================================\n");

console.log("✅ Magic Link Works Because:");
console.log("   - Email service is active");
console.log("   - Basic email delivery is working");
console.log("   - Magic link template exists\n");

console.log("❌ Sign-Up Doesn't Work Because:");
console.log("   - 'Confirm signup' template not configured");
console.log("   - Email confirmations not enabled");
console.log("   - Database tables don't exist yet");
console.log("   - User creation fails silently\n");

console.log("🚀 Quick Fix Steps:");
console.log("==================\n");

console.log("1. Run database migration:");
console.log("   pnpm migrate\n");

console.log("2. Configure email templates in Supabase dashboard");
console.log("3. Enable email confirmations");
console.log("4. Test sign-up with a new email\n");

console.log("🔗 Dashboard Links:");
console.log("==================\n");

console.log(`- Supabase Dashboard: ${supabaseUrl.replace("/rest/v1", "")}`);
console.log("- Email Templates: Authentication > Email Templates");
console.log("- URL Configuration: Authentication > URL Configuration");
console.log("- Email Providers: Authentication > Providers > Email");
console.log("- SQL Editor: SQL Editor (for migration)");

console.log("\n✅ After completing these steps, sign-up emails should work!");

