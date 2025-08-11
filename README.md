# Travel Expenses Tracker

A modern, responsive web application for tracking travel expenses with budget management, expense categorization, and travel countdown features.

## Features

- 💰 **Budget Management**: Set and track travel budgets with real-time updates
- 📊 **Expense Tracking**: Categorize and manage travel expenses
- ⏰ **Travel Countdown**: Countdown timer to your travel date
- 📈 **Data Visualization**: Charts and analytics for spending patterns
- 📱 **Responsive Design**: Works seamlessly on all devices
- 🗄️ **Database Storage**: Supabase integration for persistent data storage
- 📤 **Export Options**: Export data to Excel or JSON formats

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI components
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **State Management**: React hooks with custom database hooks
- **Package Manager**: pnpm

## Supabase Integration

This project uses Supabase to replace localStorage for persistent data storage. All user data (expenses, budgets, travel countdowns) is now stored in a PostgreSQL database.

### What's Been Implemented

✅ **Database Service Layer** (`lib/database.ts`)
- CRUD operations for expenses, budgets, and travel countdowns
- Automatic data transformation between database and UI formats
- Error handling and logging

✅ **Custom Database Hook** (`hooks/use-database.ts`)
- React hook for managing database state
- Automatic data loading and synchronization
- Optimistic updates for better UX

✅ **Component Updates**
- Travel countdown component now uses database instead of localStorage
- Main page updated to use database operations
- Automatic migration from localStorage to database

✅ **Database Schema** (`supabase-migration.sql`)
- Users table for future authentication
- Expenses table for expense tracking
- Budgets table for budget management
- Travel countdowns table for countdown data
- Proper indexes and RLS policies

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm package manager
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd travel-expenses-tracker
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up Supabase:
   - Follow the [Supabase Setup Guide](./SUPABASE_SETUP.md)
   - Create your `.env.local` file with Supabase credentials

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env.local` file based on `env.template`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Setup

1. Run the SQL migration in your Supabase SQL Editor
2. The app will automatically create the necessary tables
3. Existing localStorage data will be migrated automatically

## Project Structure

```
travel-expenses-tracker/
├── app/                    # Next.js app router
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── expense-charts.tsx # Expense visualization
│   ├── expense-table.tsx  # Expense management table
│   └── travel-countdown.tsx # Travel countdown component
├── hooks/                 # Custom React hooks
│   ├── use-database.ts   # Database operations hook
│   └── use-toast.ts      # Toast notifications
├── lib/                   # Utility libraries
│   ├── database.ts       # Database service layer
│   ├── supabase.ts       # Supabase client configuration
│   └── utils.ts          # Utility functions
├── supabase-migration.sql # Database schema
└── SUPABASE_SETUP.md     # Supabase setup guide
```

## Usage

1. **Set Budget**: Click the settings icon on the budget card to set your travel budget
2. **Add Expenses**: Use the "Add Expense" button to add expense categories and amounts
3. **Track Countdown**: Set your travel date to start the countdown timer
4. **Monitor Spending**: View real-time budget progress and spending analytics
5. **Export Data**: Export your data to Excel or JSON formats

## Data Migration

The app automatically migrates existing localStorage data to Supabase on first load. No manual intervention required.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues related to:
- **Supabase Setup**: See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **General Issues**: Check the GitHub issues page
- **Database Problems**: Verify your Supabase configuration and environment variables