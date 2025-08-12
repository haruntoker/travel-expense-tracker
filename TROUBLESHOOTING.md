# Authentication Troubleshooting Guide

## Issue: 500 Internal Server Error on Magic Link

The error you're experiencing is a common Supabase configuration issue. Here's how to fix it:

## 🔍 Root Causes

1. **Missing Database Schema**: Tables don't exist, causing OTP endpoint to fail
2. **Incorrect Site URL Configuration**: Supabase doesn't recognize your domain
3. **Missing Email Templates**: No templates configured for magic links
4. **Disabled Email Services**: Email authentication is not properly enabled
5. **Missing RLS Policies**: Row Level Security not configured

## 🛠️ Step-by-Step Fix

### Step 1: Run the Setup Script
```bash
pnpm setup
```

This will give you detailed instructions for your specific project.

### Step 2: Configure Supabase Dashboard

#### A. Site URL Configuration
1. Go to **Authentication > URL Configuration**
2. Set **Site URL** to: `https://codeabletest.site`
3. Add to **Redirect URLs**:
   - `https://codeabletest.site/auth/callback`
   - `https://codeabletest.site/auth/reset-password`

#### B. Email Templates
1. Go to **Authentication > Email Templates**
2. Configure **Confirm signup** template:
   - Set redirect URL to: `https://codeabletest.site/auth/callback`
3. Configure **Magic Link** template:
   - Set redirect URL to: `https://codeabletest.site/auth/callback`

#### C. Email Provider Settings
1. Go to **Authentication > Providers > Email**
2. Enable **"Enable email confirmations"**
3. Enable **"Enable magic links"**
4. Verify email service is active

### Step 3: Create Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run the SQL
4. Verify tables are created in **Table Editor**

### Step 4: Test Authentication

1. Try signing up with a new email address
2. Check if confirmation email is received
3. Try magic link authentication
4. Monitor browser console for errors

## 🚨 Common Issues & Solutions

### Issue: "Invalid redirect URL"
**Solution**: Ensure your domain is added to Supabase redirect URLs

### Issue: "Email not sent"
**Solution**: Check email service status and quota in Supabase dashboard

### Issue: "Table doesn't exist"
**Solution**: Run the database migration SQL script

### Issue: "RLS policy violation"
**Solution**: The migration script automatically creates proper RLS policies

### Issue: "Project paused"
**Solution**: Check if your Supabase project is active in the dashboard

## 🔧 Advanced Debugging

### Check Environment Variables
```bash
# Verify .env.local exists and has correct values
cat .env.local
```

### Test Database Connection
```javascript
// In browser console
import { supabase } from '@/lib/supabase'
supabase.auth.getSession().then(console.log)
```

### Check Network Requests
1. Open browser DevTools
2. Go to Network tab
3. Try authentication
4. Look for failed requests to Supabase

## 📱 Testing Checklist

- [ ] Environment variables are set correctly
- [ ] Supabase project is active (not paused)
- [ ] Site URL is configured as `https://codeabletest.site`
- [ ] Redirect URLs include `/auth/callback`
- [ ] Email templates are configured
- [ ] Email service is enabled
- [ ] Database schema is created
- [ ] RLS policies are in place
- [ ] Magic link authentication works
- [ ] Email confirmation works

## 🆘 Still Having Issues?

If you're still experiencing problems after following these steps:

1. **Check Supabase Status**: Visit [status.supabase.com](https://status.supabase.com)
2. **Review Logs**: Check Supabase dashboard > Logs
3. **Contact Support**: Use Supabase Discord or GitHub issues
4. **Verify Plan**: Ensure your plan supports email authentication

## 🔗 Useful Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Troubleshooting Auth](https://supabase.com/docs/guides/auth/troubleshooting)

---

**Note**: The 500 error typically indicates a server-side configuration issue, not a client-side code problem. Following the setup steps above should resolve the authentication issues.
