# 🚨 RLS Policy Fix Guide - Fix 406 Errors

## **Problem Identified**
Your app is stuck in a loading state because of `406 (Not Acceptable)` errors when trying to fetch data for personal use (where `travel_profile_id` is null). This is a Row Level Security (RLS) policy issue in Supabase.

## **Root Cause**
The current RLS policies only allow users to see data where `user_id = auth.uid()`, but they don't handle the case where `travel_profile_id` is null (personal use). The policies are too restrictive.

## **Immediate Fix Applied**
I've temporarily disabled the loading state so you can see the app while we fix the RLS policies.

## **Permanent Fix - Choose One Option:**

### **Option 1: Run the Fix Script (Recommended)**
```bash
pnpm fix:rls
```

### **Option 2: Manual Fix in Supabase Dashboard**

1. **Go to your Supabase Dashboard**
   - Navigate to your project
   - Click on "SQL Editor" in the left sidebar

2. **Copy and paste this SQL:**
```sql
-- Fix RLS Policies for Personal Use and Travel Profiles
-- This migration updates the RLS policies to properly handle both scenarios:
-- 1. Personal use (travel_profile_id IS NULL)
-- 2. Travel profile use (travel_profile_id IS NOT NULL)

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;

DROP POLICY IF EXISTS "Users can view own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON public.budgets;

DROP POLICY IF EXISTS "Users can view own travel countdowns" ON public.travel_countdowns;
DROP POLICY IF EXISTS "Users can insert own travel countdowns" ON public.travel_countdowns;
DROP POLICY IF EXISTS "Users can update own travel countdowns" ON public.travel_countdowns;
DROP POLICY IF EXISTS "Users can delete own travel countdowns" ON public.travel_countdowns;

-- Create new policies that handle both personal and travel profile scenarios
-- Simplified version that works with current schema

-- Expenses policies
CREATE POLICY "Users can view own expenses" ON public.expenses
    FOR SELECT USING (
        auth.uid() = user_id AND (
            travel_profile_id IS NULL OR 
            travel_profile_id IN (
                SELECT id FROM public.travel_profiles 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert own expenses" ON public.expenses
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND (
            travel_profile_id IS NULL OR 
            travel_profile_id IN (
                SELECT id FROM public.travel_profiles 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update own expenses" ON public.expenses
    FOR UPDATE USING (
        auth.uid() = user_id AND (
            travel_profile_id IS NULL OR 
            travel_profile_id IN (
                SELECT id FROM public.travel_profiles 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete own expenses" ON public.expenses
    FOR DELETE USING (
        auth.uid() = user_id AND (
            travel_profile_id IS NULL OR 
            travel_profile_id IN (
                SELECT id FROM public.travel_profiles 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Budgets policies
CREATE POLICY "Users can view own budgets" ON public.budgets
    FOR SELECT USING (
        auth.uid() = user_id AND (
            travel_profile_id IS NULL OR 
            travel_profile_id IN (
                SELECT id FROM public.travel_profiles 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert own budgets" ON public.budgets
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND (
            travel_profile_id IS NULL OR 
            travel_profile_id IN (
                SELECT id FROM public.travel_profiles 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update own budgets" ON public.budgets
    FOR UPDATE USING (
        auth.uid() = user_id AND (
            travel_profile_id IS NULL OR 
            travel_profile_id IN (
                SELECT id FROM public.travel_profiles 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete own budgets" ON public.budgets
    FOR DELETE USING (
        auth.uid() = user_id AND (
            travel_profile_id IS NULL OR 
            travel_profile_id IN (
                SELECT id FROM public.travel_profiles 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Travel countdowns policies
CREATE POLICY "Users can view own travel countdowns" ON public.travel_countdowns
    FOR SELECT USING (
        auth.uid() = user_id AND (
            travel_profile_id IS NULL OR 
            travel_profile_id IN (
                SELECT id FROM public.travel_profiles 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert own travel countdowns" ON public.travel_countdowns
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND (
            travel_profile_id IS NULL OR 
            travel_profile_id IN (
                SELECT id FROM public.travel_profiles 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert own travel countdowns" ON public.travel_countdowns
    FOR UPDATE USING (
        auth.uid() = user_id AND (
            travel_profile_id IS NULL OR 
            travel_profile_id IN (
                SELECT id FROM public.travel_profiles 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete own travel countdowns" ON public.travel_countdowns
    FOR DELETE USING (
        auth.uid() = user_id AND (
            travel_profile_id IS NULL OR 
            travel_profile_id IN (
                SELECT id FROM public.travel_profiles 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'RLS policies updated successfully!';
    RAISE NOTICE 'Now supports both personal use (travel_profile_id IS NULL) and travel profile use';
    RAISE NOTICE 'Users can access their data regardless of travel profile selection';
END $$;
```

3. **Click "Run"**

### **Option 3: Use the Migration File**
The SQL is also saved in `supabase/migrations/005_fix_rls_policies.sql`

## **What This Fix Does**

✅ **Allows Personal Use**: Users can now access data where `travel_profile_id` is NULL  
✅ **Maintains Security**: Users can only access their own data  
✅ **Supports Travel Profiles**: Users can still access travel profile data  
✅ **Fixes 406 Errors**: No more "Not Acceptable" responses  

## **After Running the Fix**

1. **Restart your app** (if running)
2. **The loading spinner should disappear**
3. **You should see the dashboard immediately**
4. **Data should load without errors**

## **Re-enable Loading State (After Fix)**

Once the RLS policies are fixed, you can re-enable the loading state by editing `app/page.tsx`:

```typescript
// Change this line back to:
const shouldShowDatabaseLoading = user && (!isInitialized || (isLoading && expenses.length === 0));
```

## **Verification**

After running the fix, check the browser console - you should see:
- ✅ No more 406 errors
- ✅ Data loading successfully
- ✅ App working normally

## **Need Help?**

If you still see issues after running the fix:
1. Check the Supabase dashboard for any error messages
2. Verify the policies were created successfully
3. Check the browser console for any remaining errors

---

**The fix should resolve your loading issue completely!** 🎉
