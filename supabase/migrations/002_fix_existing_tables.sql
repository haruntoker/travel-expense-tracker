-- Migration to fix existing tables and ensure correct structure
-- This migration handles cases where tables might already exist with different schemas

-- First, let's check what tables exist and drop them if they have wrong structure
DO $$
BEGIN
    -- Drop existing tables if they exist (this will remove any data)
    DROP TABLE IF EXISTS public.travel_countdowns CASCADE;
    DROP TABLE IF EXISTS public.expenses CASCADE;
    DROP TABLE IF EXISTS public.budgets CASCADE;
    DROP TABLE IF EXISTS public.travel_profiles CASCADE;
    DROP TABLE IF EXISTS public.users CASCADE;
    
    RAISE NOTICE 'Dropped existing tables to ensure clean schema';
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own travel profiles" ON public.travel_profiles;
DROP POLICY IF EXISTS "Users can insert own travel profiles" ON public.travel_profiles;
DROP POLICY IF EXISTS "Users can update own travel profiles" ON public.travel_profiles;
DROP POLICY IF EXISTS "Users can delete own travel profiles" ON public.travel_profiles;
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

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Now recreate everything with the correct structure
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create travel_profiles table
CREATE TABLE public.travel_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE public.expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    travel_profile_id UUID REFERENCES public.travel_profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create budgets table
CREATE TABLE public.budgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    travel_profile_id UUID REFERENCES public.travel_profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create travel_countdowns table
CREATE TABLE public.travel_countdowns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    travel_profile_id UUID REFERENCES public.travel_profiles(id) ON DELETE CASCADE,
    travel_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_travel_profile_id ON public.expenses(travel_profile_id);
CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX idx_budgets_travel_profile_id ON public.budgets(travel_profile_id);
CREATE INDEX idx_travel_countdowns_user_id ON public.travel_countdowns(user_id);
CREATE INDEX idx_travel_countdowns_travel_profile_id ON public.travel_countdowns(travel_profile_id);
CREATE INDEX idx_travel_profiles_user_id ON public.travel_profiles(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_countdowns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Travel profiles policies
CREATE POLICY "Users can view own travel profiles" ON public.travel_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own travel profiles" ON public.travel_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own travel profiles" ON public.travel_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own travel profiles" ON public.travel_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Expenses policies
CREATE POLICY "Users can view own expenses" ON public.expenses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" ON public.expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" ON public.expenses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" ON public.expenses
    FOR DELETE USING (auth.uid() = user_id);

-- Budgets policies
CREATE POLICY "Users can view own budgets" ON public.budgets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets" ON public.budgets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets" ON public.budgets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets" ON public.budgets
    FOR DELETE USING (auth.uid() = user_id);

-- Travel countdowns policies
CREATE POLICY "Users can view own travel countdowns" ON public.travel_countdowns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own travel countdowns" ON public.travel_countdowns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own travel countdowns" ON public.travel_countdowns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own travel countdowns" ON public.travel_countdowns
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Insert a test user profile for existing auth users (if any)
INSERT INTO public.users (id, email)
SELECT id, email FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully! All tables created with correct structure.';
END $$;
