# Supabase Setup Guide

This guide will help you set up Supabase to replace localStorage in your travel expenses tracker.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `travel-expenses-tracker`
   - Database Password: Choose a strong password
   - Region: Choose closest to you
5. Click "Create new project"

## 2. Get Your Project Credentials

1. In your project dashboard, go to Settings > API
2. Copy the following values:
   - Project URL
   - Anon public key

## 3. Set Environment Variables

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace the placeholder values with your actual Supabase credentials.

## 4. Set Up Database Schema

1. In your Supabase dashboard, go to SQL Editor
2. Copy the contents of `supabase-migration.sql`
3. Paste and run the SQL to create your tables

## 5. Test the Integration

1. Start your development server: `pnpm dev`
2. The app will automatically migrate any existing localStorage data
3. All new data will be stored in Supabase

## 6. Verify Data Storage

1. Go to your Supabase dashboard > Table Editor
2. Check that data is being stored in the tables:
   - `expenses`
   - `budgets`
   - `travel_countdowns`

## 7. Security Considerations

The current setup allows all operations for development. For production:

1. Implement proper user authentication
2. Update RLS policies to restrict access by user
3. Use environment-specific keys
4. Enable audit logging

## 8. Troubleshooting

### Common Issues:

1. **"Invalid API key" error**: Check your environment variables
2. **"Table doesn't exist"**: Run the migration SQL
3. **"RLS policy violation"**: Check your RLS policies
4. **Data not loading**: Check browser console for errors

### Debug Mode:

Enable debug logging by adding to your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_DEBUG=true
```

## 9. Migration from localStorage

The app automatically migrates existing localStorage data on first load. If you need to manually migrate:

1. Check browser localStorage for existing data
2. Use the migration function in the database service
3. Clear localStorage after successful migration

## 10. Next Steps

- Implement user authentication
- Add data backup/export features
- Set up real-time subscriptions
- Add data validation and sanitization
- Implement proper error handling and retry logic
