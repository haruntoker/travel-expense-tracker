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
  const { toast } = useToast()

  // Load all data from database with retry mechanism
  const loadData = useCallback(async (retryCount = 0) => {
    try {
      setIsLoading(true)
      console.log(`loadData: Loading data for travelProfileId: ${travelProfileId || 'personal use'} (attempt ${retryCount + 1})`)
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Data loading timeout')), 30000) // 30 second timeout
      })
      
      const dataPromise = Promise.all([
        DatabaseService.getExpenses(travelProfileId || undefined),
        DatabaseService.getBudget(travelProfileId || undefined),
        DatabaseService.getTravelCountdown(travelProfileId || undefined),
      ])
      
      const [expensesData, budgetData, countdownData] = await Promise.race([dataPromise, timeoutPromise])

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
      
      console.log('loadData: Data loaded successfully:', {
        expenses: transformedExpenses.length,
        budget: transformedBudget ? `€${transformedBudget.amount}` : 'none',
        countdown: transformedCountdown ? 'active' : 'none'
      })
      
      setIsInitialized(true)
    } catch (error) {
      console.error(`Error loading data (attempt ${retryCount + 1}):`, error)
      
      // Retry logic (max 3 attempts)
      if (retryCount < 2 && !(error instanceof Error && error.message === 'User not authenticated')) {
        console.log(`Retrying data load (attempt ${retryCount + 2})...`)
        setTimeout(() => loadData(retryCount + 1), 2000) // Wait 2 seconds before retry
        return
      }
      
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
    }
  }, [travelProfileId, toast])

  // Initialize data on mount - now allows data loading without travel profile
  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    const initializeData = async () => {
      try {
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
          // User is authenticated, load data
          console.log('useDatabase: User authenticated, loading data (travelProfileId:', travelProfileId || 'personal use', ')');
          if (mounted) {
            await loadData();
          }
        } else {
          // No user session, retry a few times in case session is still loading
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`useDatabase: No user session, retrying in 1 second (attempt ${retryCount}/${maxRetries})`);
            setTimeout(() => {
              if (mounted) {
                initializeData();
              }
            }, 1000);
            return;
          }
          
          // Max retries reached, mark as initialized
          console.log('useDatabase: No user session after retries, marking as initialized');
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
  }, [travelProfileId]) // Remove loadData from dependencies to prevent circular issues

  // Reload data when travelProfileId changes (for profile switching)
  useEffect(() => {
    if (isInitialized && !isLoading) {
      console.log('useDatabase: travelProfileId changed, reloading data:', travelProfileId || 'personal use');
      loadData();
    }
  }, [travelProfileId, isInitialized, isLoading]) // Remove loadData from dependencies

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
  }, [isInitialized]) // Remove loadData and clearData from dependencies

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
      console.log('=== REMOVE BUDGET DEBUG ===')
      console.log('Current budget state:', budget)
      console.log('Attempting to remove budget...')
      
      const success = await DatabaseService.removeBudget(travelProfileId || undefined)
      console.log('Remove budget result:', success)
      
      if (success) {
        console.log('Setting budget state to null')
        setBudget(null)
        toast({
          title: '🗑️ Budget Removed!',
          description: 'Your budget has been removed successfully.',
        })
        return true
      } else {
        console.log('Budget removal failed in database service')
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
