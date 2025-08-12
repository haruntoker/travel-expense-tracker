#!/usr/bin/env node

/**
 * Supabase Setup Script
 * This script helps you configure Supabase for your travel expenses tracker
 */

const fs = require("fs");
const path = require("path");

console.log("🚀 Supabase Setup Script for Travel Expenses Tracker");
console.log("===================================================\n");

// Check if .env.local exists
const envPath = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ .env.local file not found!");
  console.log(
    "Please create a .env.local file with your Supabase credentials first."
  );
  process.exit(1);
}

console.log("✅ .env.local file found");

// Read environment variables
const envContent = fs.readFileSync(envPath, "utf8");
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1];
const supabaseKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1];

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables in .env.local");
  console.log("Please ensure you have:");
  console.log("- NEXT_PUBLIC_SUPABASE_URL");
  console.log("- NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

console.log("✅ Supabase environment variables found");

// Extract project reference from URL
const projectRef = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error("❌ Invalid Supabase URL format");
  process.exit(1);
}

console.log(`\n📋 Configuration Summary:`);
console.log(`Project Reference: ${projectRef}`);
console.log(`Project URL: ${supabaseUrl}`);

console.log("\n🔧 Required Supabase Configuration Steps:");
console.log("=====================================");

console.log("\n1. 📧 Email Templates Setup:");
console.log(
  "   - Go to Authentication > Email Templates in your Supabase dashboard"
);
console.log('   - Configure "Confirm signup" template');
console.log('   - Configure "Magic Link" template');
console.log(
  "   - Set redirect URLs to: https://codeabletest.site/auth/callback"
);

console.log("\n2. 🌐 Site URL Configuration:");
console.log("   - Go to Authentication > URL Configuration");
console.log("   - Set Site URL to: https://codeabletest.site");
console.log(
  "   - Add to Redirect URLs: https://codeabletest.site/auth/callback"
);
console.log(
  "   - Add to Redirect URLs: https://codeabletest.site/auth/reset-password"
);

console.log("\n3. 📱 Allowed Email Domains:");
console.log("   - Go to Authentication > Providers > Email");
console.log('   - Enable "Enable email confirmations"');
console.log('   - Enable "Enable magic links"');
console.log("   - Add your domain to allowed email domains if needed");

console.log("\n4. 🗄️ Database Schema:");
console.log("   - Go to SQL Editor in your Supabase dashboard");
console.log(
  "   - Copy the contents of supabase/migrations/001_initial_schema.sql"
);
console.log("   - Paste and run the SQL to create your tables");

console.log("\n5. 🔐 Row Level Security:");
console.log("   - The migration script will automatically enable RLS");
console.log("   - Policies will be created for secure data access");

console.log("\n6. 🧪 Test Authentication:");
console.log("   - Try signing up with a new email");
console.log("   - Check if confirmation email is received");
console.log("   - Try magic link authentication");

console.log("\n⚠️  Important Notes:");
console.log(
  "- Make sure your domain (codeabletest.site) is properly configured"
);
console.log("- Check that your Supabase project is not paused");
console.log("- Verify that email service is enabled in your Supabase project");
console.log("- Ensure you have sufficient email quota for your plan");

console.log("\n🔗 Useful Links:");
console.log(
  `- Supabase Dashboard: https://supabase.com/dashboard/project/${projectRef}`
);
console.log("- Authentication Docs: https://supabase.com/docs/guides/auth");
console.log(
  "- Email Templates: https://supabase.com/docs/guides/auth/auth-email-templates"
);

console.log("\n✅ Setup instructions complete!");
console.log(
  "Follow these steps in your Supabase dashboard to resolve the authentication issues."
);
