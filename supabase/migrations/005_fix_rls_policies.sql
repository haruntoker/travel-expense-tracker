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

CREATE POLICY "Users can update own travel countdowns" ON public.travel_countdowns
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
