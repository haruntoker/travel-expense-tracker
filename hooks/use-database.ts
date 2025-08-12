import { DatabaseService } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { useCallback, useEffect, useState } from 'react'
import { useToast } from './use-toast'

export interface DatabaseExpense {
  id: string
  category: string
  amount: number
  createdAt: Date
  updatedAt: Date
}

export interface DatabaseTravelCountdown {
  id: string
  travelDate: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DatabaseBudget {
  id: string
  amount: number
  createdAt: Date
  updatedAt: Date
}

export function useDatabase(travelProfileId: string | null) {
  const [expenses, setExpenses] = useState<DatabaseExpense[]>([])
  const [budget, setBudget] = useState<DatabaseBudget | null>(null)
  const [travelCountdown, setTravelCountdown] = useState<DatabaseTravelCountdown | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastLoadTime, setLastLoadTime] = useState<number>(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  // Cache key for this profile
  const cacheKey = `data_${travelProfileId || 'personal'}`

  // Check if we need to reload data (only reload if data is older than 5 minutes)
  const shouldReloadData = useCallback(() => {
    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000
    return now - lastLoadTime > fiveMinutes
  }, [lastLoadTime])

  // Load all data from database with retry mechanism
  const loadData = useCallback(async (forceReload = false, retryCount = 0) => {
    try {
      // If not forcing reload and we have recent data, skip loading
      if (!forceReload && !shouldReloadData() && expenses.length > 0) {
        console.log('🔍 loadData: Skipping load - data is recent and available');
        return;
      }

      console.log('🔍 loadData: Starting data load for travelProfileId:', travelProfileId || 'personal use', 'attempt:', retryCount + 1);
      
      // Only show loading spinner on first load or forced reload
      if (expenses.length === 0 || forceReload) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Data loading timeout')), 30000) // 30 second timeout
      })
      
      // Always attempt to load data - pass undefined for personal use, travelProfileId for profiles
      const dataPromise = Promise.all([
        DatabaseService.getExpenses(travelProfileId || undefined),
        DatabaseService.getBudget(travelProfileId || undefined),
        DatabaseService.getTravelCountdown(travelProfileId || undefined),
      ])
      
      const [expensesData, budgetData, countdownData] = await Promise.race([dataPromise, timeoutPromise])

      console.log('🔍 loadData: Raw data received:', {
        expenses: expensesData?.length || 0,
        budget: budgetData ? `€${budgetData.amount}` : 'none',
        countdown: countdownData ? 'active' : 'none'
      });

      // Transform expenses data
      const transformedExpenses = expensesData.map((expense: any) => ({
        id: expense.id,
        category: expense.category,
        amount: expense.amount,
        createdAt: new Date(expense.created_at),
        updatedAt: new Date(expense.updated_at),
      }))

      // Transform budget data
      const transformedBudget = budgetData ? {
        id: budgetData.id,
        amount: budgetData.amount,
        createdAt: new Date(budgetData.created_at),
        updatedAt: new Date(budgetData.updated_at),
      } : null

      // Transform countdown data
      const transformedCountdown = countdownData ? {
        id: countdownData.id,
        travelDate: countdownData.travel_date,
        isActive: countdownData.is_active,
        createdAt: new Date(countdownData.created_at),
        updatedAt: new Date(countdownData.updated_at),
      } : null

      setExpenses(transformedExpenses)
      setBudget(transformedBudget)
      setTravelCountdown(transformedCountdown)
      setLastLoadTime(Date.now())
      
      console.log('🔍 loadData: Data loaded successfully:', {
        expenses: transformedExpenses.length,
        budget: transformedBudget ? `€${transformedBudget.amount}` : 'none',
        countdown: transformedCountdown ? 'active' : 'none'
      });
      
      setIsInitialized(true)
    } catch (error) {
      console.error('🔍 loadData: Error loading data (attempt', retryCount + 1, '):', error);
      
      // Don't retry on authentication errors or if already initialized
      if (error instanceof Error && (
        error.message === 'User not authenticated' || 
        error.message === 'Data loading timeout'
      )) {
        console.log('🔍 loadData: Not retrying due to error type:', error.message);
        setIsInitialized(true)
        setIsLoading(false)
        return
      }
      
      // Retry logic (max 1 attempt)
      if (retryCount < 1) {
        console.log('🔍 loadData: Retrying data load in 2 seconds...');
        setTimeout(() => loadData(forceReload, retryCount + 1), 2000) // Wait 2 seconds before retry
        return
      }
      
      // Mark as initialized even on error to prevent infinite loops
      setIsInitialized(true)
      setIsLoading(false)
      
      // Handle timeout errors specifically
      if (error instanceof Error && error.message === 'Data loading timeout') {
        toast({
          title: '⏰ Loading Timeout',
          description: 'Data loading is taking longer than expected. Please check your connection and try refreshing.',
          variant: 'destructive',
        })
      } else if (!(error instanceof Error && error.message === 'User not authenticated')) {
        toast({
          title: '⚠️ Data Load Error',
          description: 'Failed to load data from database after multiple attempts. Please check your connection and try refreshing.',
          variant: 'destructive',
        })
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [travelProfileId, toast, expenses.length, shouldReloadData])

  // Initialize data on mount - now allows data loading for both personal and travel profile use
  useEffect(() => {
    let mounted = true;
    
    const initializeData = async () => {
      try {
        console.log('🔍 useDatabase: Initializing data for travelProfileId:', travelProfileId || 'personal use');
        
        // Check if we have a user session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('useDatabase: Auth session error:', error);
          if (mounted) {
            setIsInitialized(true);
            setIsLoading(false);
          }
          return;
        }
        
        if (session?.user) {
          console.log('useDatabase: User authenticated, loading data for:', travelProfileId || 'personal use');
          // User is authenticated, load data (for personal use or travel profile)
          if (mounted) {
            await loadData();
          }
        } else {
          console.log('useDatabase: No user session, marking as initialized');
          // No user session, mark as initialized
          if (mounted) {
            setIsInitialized(true);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('useDatabase: Initialization error:', error);
        if (mounted) {
          setIsInitialized(true);
          setIsLoading(false);
        }
      }
    };
    
    initializeData();
    
    return () => {
      mounted = false;
    };
  }, [travelProfileId, loadData]) // Only depend on travelProfileId

  // Reload data when travelProfileId changes (for profile switching)
  useEffect(() => {
    if (isInitialized && !isLoading && travelProfileId) {
      console.log('useDatabase: travelProfileId changed, reloading data for:', travelProfileId);
      loadData();
    }
  }, [travelProfileId, isInitialized, isLoading, loadData]) // Remove loadData from dependencies

  // Listen for auth state changes to reload data when user logs in
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('useDatabase: Auth state changed:', event, session?.user?.id ? 'user logged in' : 'no user');
      
      if (event === 'SIGNED_IN' && session?.user && isInitialized) {
        console.log('useDatabase: User signed in, reloading data');
        await loadData();
      } else if (event === 'SIGNED_OUT') {
        console.log('useDatabase: User signed out, clearing data');
        clearData();
      }
    });

    return () => subscription.unsubscribe();
  }, [isInitialized, loadData])

  // Listen for page visibility changes to intelligently refresh data
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isInitialized && !isLoading) {
        // Only refresh if data is older than 5 minutes and we're not already loading
        if (shouldReloadData() && expenses.length > 0) {
          console.log('useDatabase: Page became visible, refreshing stale data');
          loadData(false); // Don't force reload, just refresh if needed
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isInitialized, isLoading, shouldReloadData, loadData, expenses.length]);

  // Expense operations
  const addExpense = useCallback(async (category: string, amount: number) => {
    try {
      const newExpense = await DatabaseService.addExpense(category, amount, travelProfileId || undefined)
      if (newExpense) {
        const transformedExpense: DatabaseExpense = {
          id: newExpense.id,
          category: newExpense.category,
          amount: newExpense.amount,
          createdAt: new Date(newExpense.created_at),
          updatedAt: new Date(newExpense.updated_at),
        }
        setExpenses(prev => [transformedExpense, ...prev])
        toast({
          title: '✅ Expense Added!',
          description: `Successfully added "${category}" for €${amount.toLocaleString()}`,
        })
        return true
      }
      return false
    } catch (error) {
      console.error('Error adding expense:', error)
      toast({
        title: '❌ Add Failed',
        description: 'Failed to add expense. Please try again.',
        variant: 'destructive',
      })
      return false
    }
  }, [toast, travelProfileId])

  const updateExpense = useCallback(async (id: string, amount: number, category?: string) => {
    try {
      const updatedExpense = await DatabaseService.updateExpense(id, amount, category, travelProfileId || undefined)
      if (updatedExpense) {
        setExpenses(prev => prev.map(expense => 
          expense.id === id 
            ? {
                ...expense,
                amount,
                category: category || expense.category,
                updatedAt: new Date(),
              }
            : expense
        ))
        toast({
          title: '✏️ Expense Updated!',
          description: 'Expense updated successfully!',
        })
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating expense:', error)
      toast({
        title: '❌ Update Failed',
        description: 'Failed to update expense. Please try again.',
        variant: 'destructive',
      })
      return false
    }
  }, [toast, travelProfileId])

  const deleteExpense = useCallback(async (id: string) => {
    try {
      const success = await DatabaseService.deleteExpense(id, travelProfileId || undefined)
      if (success) {
        setExpenses(prev => prev.filter(expense => expense.id !== id))
        toast({
          title: '🗑️ Expense Deleted!',
          description: 'Expense removed successfully!',
        })
        return true
      }
      return false
    } catch (error) {
      console.error('Error deleting expense:', error)
      toast({
        title: '❌ Delete Failed',
        description: 'Failed to delete expense. Please try again.',
        variant: 'destructive',
      })
      return false
    }
  }, [toast, travelProfileId])

  // Budget operations
  const setDatabaseBudget = useCallback(async (amount: number) => {
    try {
      const newBudget = await DatabaseService.setBudget(amount, travelProfileId || undefined)
      if (newBudget) {
        const transformedBudget: DatabaseBudget = {
          id: newBudget.id,
          amount: newBudget.amount,
          createdAt: new Date(newBudget.created_at),
          updatedAt: new Date(newBudget.updated_at),
        }
        setBudget(transformedBudget)
        toast({
          title: '💰 Budget Set!',
          description: `Budget set to €${amount.toLocaleString()}`,
        })
        return true
      }
      return false
    } catch (error) {
      console.error('Error setting budget:', error)
      toast({
        title: '❌ Budget Set Failed',
        description: 'Failed to set budget. Please try again.',
        variant: 'destructive',
      })
      return false
    }
  }, [toast, travelProfileId])

  const removeBudget = useCallback(async () => {
    try {
      const success = await DatabaseService.removeBudget(travelProfileId || undefined)
      if (success) {
        setBudget(null)
        toast({
          title: '🗑️ Budget Removed!',
          description: 'Your budget has been removed successfully.',
        })
        return true
      } else {
        toast({
          title: '❌ Budget Remove Failed',
          description: 'Failed to remove budget. Please try again.',
          variant: 'destructive',
        })
        return false
      }
    } catch (error) {
      console.error('Error removing budget:', error)
      toast({
        title: '❌ Budget Remove Failed',
        description: 'Failed to remove budget. Please try again.',
        variant: 'destructive',
      })
      return false
    }
  }, [budget, toast, travelProfileId])

  // Travel countdown operations
  const setDatabaseTravelCountdown = useCallback(async (travelDate: string) => {
    try {
      const newCountdown = await DatabaseService.setTravelCountdown(travelDate, travelProfileId || undefined)
      if (newCountdown) {
        const transformedCountdown: DatabaseTravelCountdown = {
          id: newCountdown.id,
          travelDate: newCountdown.travel_date,
          isActive: newCountdown.is_active,
          createdAt: new Date(newCountdown.created_at),
          updatedAt: new Date(newCountdown.updated_at),
        }
        setTravelCountdown(transformedCountdown)
        toast({
          title: '🎉 Countdown Started!',
          description: 'Travel countdown set successfully!',
        })
        return true
      }
      return false
    } catch (error) {
      console.error('Error setting travel countdown:', error)
      toast({
        title: '❌ Countdown Set Failed',
        description: 'Failed to set travel countdown. Please try again.',
        variant: 'destructive',
      })
      return false
    }
  }, [toast, travelProfileId])

  const clearTravelCountdown = useCallback(async () => {
    try {
      const success = await DatabaseService.clearTravelCountdown(travelProfileId || undefined)
      if (success) {
        setTravelCountdown(null)
        toast({
          title: '🗑️ Countdown Cleared',
          description: 'Travel countdown has been reset.',
        })
        return true
      }
      return false
    } catch (error) {
      console.error('Error clearing travel countdown:', error)
      toast({
        title: '❌ Clear Failed',
        description: 'Failed to clear countdown. Please try again.',
        variant: 'destructive',
      })
      return false
    }
  }, [toast, travelProfileId])

  // Migration from localStorage
  const migrateFromLocalStorage = useCallback(async (localData: {
    expenses: Array<{ category: string; amount: number; createdAt: string; updatedAt: string }>
    budget: number
    travelDate?: string
  }) => {
    try {
      const success = await DatabaseService.migrateFromLocalStorage(localData)
      if (success) {
        // Don't reload data here to avoid infinite loops
        // The main component will handle state updates
        toast({
          title: '🔄 Migration Complete!',
          description: 'Data migrated from localStorage to database successfully!',
        })
        return true
      }
      return false
    } catch (error) {
      console.error('Error migrating data:', error)
      toast({
        title: '❌ Migration Failed',
        description: 'Failed to migrate data. Please try again.',
        variant: 'destructive',
      })
      return false
    }
  }, [toast])

  // Clear all data (useful when switching profiles)
  const clearData = useCallback(() => {
    setExpenses([])
    setBudget(null)
    setTravelCountdown(null)
    setIsInitialized(false)
    setIsLoading(false)
  }, [])

  return {
    // State
    expenses,
    budget,
    travelCountdown,
    isLoading,
    isInitialized,
    isRefreshing,
    
    // Operations
    addExpense,
    updateExpense,
    deleteExpense,
    setBudget: setDatabaseBudget,
    removeBudget,
    setTravelCountdown: setDatabaseTravelCountdown,
    clearTravelCountdown,
    migrateFromLocalStorage,
    loadData,
    clearData,
  }
}
