import type { Database } from './supabase'
import { supabase } from './supabase'

type TravelCountdown = Database['public']['Tables']['travel_countdowns']['Row']
type Expense = Database['public']['Tables']['expenses']['Row']
type Budget = Database['public']['Tables']['budgets']['Row']

// Helper function to get current user ID from Supabase auth
const getCurrentUserId = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.warn('Auth error in getCurrentUserId:', error)
      throw new Error(`Authentication error: ${error.message}`)
    }
    if (!user) {
      console.warn('No user found in getCurrentUserId')
      throw new Error('User not authenticated')
    }
    return user.id
  } catch (error) {
    console.error('getCurrentUserId failed:', error)
    throw error
  }
}

export class DatabaseService {
  // Test database connection
  static async testConnection(): Promise<boolean> {
    try {
      // Test basic Supabase connection instead of auth
      const { data, error } = await supabase.from('users').select('count').limit(1)
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
        return false
      }
      return true
    } catch (error) {
      return false
    }
  }

  // Debug function to check budgets table
  static async debugBudgets(): Promise<void> {
    try {
      // Check all budgets
      const { data: allBudgets, error: allError } = await supabase
        .from('budgets')
        .select('*')
      
      if (allError) {
        return
      }
      
      // Check budgets for current user
      const userId = await getCurrentUserId()
      const { data: userBudgets, error: userError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
      
      if (userError) {
        return
      }
    } catch (error) {
      // Silent error handling
    }
  }

  // Travel Countdown Operations
  static async getTravelCountdown(travelProfileId?: string): Promise<TravelCountdown | null> {
    try {
      // Validate travelProfileId parameter
      if (travelProfileId && typeof travelProfileId !== 'string') {
        return null
      }
      
      const userId = await getCurrentUserId()
      
      let query = supabase
        .from('travel_countdowns')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)

      if (travelProfileId) {
        query = query.eq('travel_profile_id', travelProfileId)
      } else {
        query = query.eq('user_id', userId).is('travel_profile_id', null)
      }

      const { data, error } = await query.single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - this is normal for new users
          return null
        }
        return null
      }

      return data
    } catch (error) {
      if (error instanceof Error && error.message.includes('User not authenticated')) {
        return null
      }
      return null
    }
  }

  static async setTravelCountdown(travelDate: string, travelProfileId?: string): Promise<TravelCountdown | null> {
    try {
      const userId = await getCurrentUserId()
      
      // First, deactivate any existing countdowns for this user/profile
      let deactivateQuery = supabase
        .from('travel_countdowns')
        .update({ is_active: false })
        .eq('user_id', userId)

      if (travelProfileId) {
        deactivateQuery = deactivateQuery.eq('travel_profile_id', travelProfileId)
      } else {
        deactivateQuery = deactivateQuery.is('travel_profile_id', null)
      }

      await deactivateQuery

      // Create new countdown with travel profile context
      const countdownData: any = {
        user_id: userId,
        travel_date: travelDate,
        is_active: true,
      }

      if (travelProfileId) {
        countdownData.travel_profile_id = travelProfileId
      }

      const { data, error } = await supabase
        .from('travel_countdowns')
        .insert(countdownData)
        .select()
        .single()

      if (error) {
        console.error('Error setting travel countdown:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in setTravelCountdown:', error)
      return null
    }
  }

  static async clearTravelCountdown(travelProfileId?: string): Promise<boolean> {
    try {
      const userId = await getCurrentUserId()
      let query = supabase
        .from('travel_countdowns')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true)

      if (travelProfileId) {
        query = query.eq('travel_profile_id', travelProfileId)
      } else {
        query = query.is('travel_profile_id', null)
      }

      const { error } = await query

      if (error) {
        console.error('Error clearing travel countdown:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in clearTravelCountdown:', error)
      return false
    }
  }

  // Expense Operations
  static async getExpenses(travelProfileId?: string): Promise<Expense[]> {
    try {
      // Validate travelProfileId parameter
      if (travelProfileId && typeof travelProfileId !== 'string') {
        return []
      }
      
      const userId = await getCurrentUserId()
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (travelProfileId) {
        query = query.eq('travel_profile_id', travelProfileId)
      } else {
        query = query.is('travel_profile_id', null)
      }

      const { data, error } = await query

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - this is normal for new users
          return []
        }
        return []
      }

      return data || []
    } catch (error) {
      if (error instanceof Error && error.message.includes('User not authenticated')) {
        return []
      }
      return []
    }
  }

  static async addExpense(category: string, amount: number, travelProfileId?: string): Promise<Expense | null> {
    try {
      const userId = await getCurrentUserId()
      const expenseData: any = {
        user_id: userId,
        category,
        amount,
      }

      if (travelProfileId) {
        expenseData.travel_profile_id = travelProfileId
      }

      const { data, error } = await supabase
        .from('expenses')
        .insert(expenseData)
        .select()
        .single()

      if (error) {
        console.error('Error adding expense:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in addExpense:', error)
      return null
    }
  }

  static async updateExpense(id: string, amount: number, category?: string, travelProfileId?: string): Promise<Expense | null> {
    try {
      const userId = await getCurrentUserId()
      const updateData: Record<string, string | number> = { amount, updated_at: new Date().toISOString() }
      if (category) {
        updateData.category = category
      }

      let query = supabase
        .from('expenses')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)

      if (travelProfileId) {
        query = query.eq('travel_profile_id', travelProfileId)
      } else {
        query = query.is('travel_profile_id', null)
      }

      const { data, error } = await query.select().single()

      if (error) {
        console.error('Error updating expense:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in updateExpense:', error)
      return null
    }
  }

  static async deleteExpense(id: string, travelProfileId?: string): Promise<boolean> {
    try {
      const userId = await getCurrentUserId()
      let query = supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (travelProfileId) {
        query = query.eq('travel_profile_id', travelProfileId)
      } else {
        query = query.is('travel_profile_id', null)
      }

      const { error } = await query

      if (error) {
        console.error('Error deleting expense:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteExpense:', error)
      return false
    }
  }

  // Budget Operations
  static async getBudget(travelProfileId?: string): Promise<Budget | null> {
    try {
      // Validate travelProfileId parameter
      if (travelProfileId && typeof travelProfileId !== 'string') {
        return null
      }
      
      const userId = await getCurrentUserId()
      let query = supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (travelProfileId) {
        query = query.eq('travel_profile_id', travelProfileId)
      } else {
        query = query.is('travel_profile_id', null)
      }

      const { data, error } = await query.single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        return null
      }

      return data
    } catch (error) {
      if (error instanceof Error && error.message.includes('User not authenticated')) {
        return null
      }
      return null
    }
  }

  static async setBudget(amount: number, travelProfileId?: string): Promise<Budget | null> {
    try {
      const userId = await getCurrentUserId()
      
      // First, remove any existing budgets for this user/profile
      await this.removeBudget(travelProfileId)

      // Then insert the new budget with travel profile context
      const budgetData: any = {
        user_id: userId,
        amount,
      }

      if (travelProfileId) {
        budgetData.travel_profile_id = travelProfileId
      }

      const { data, error } = await supabase
        .from('budgets')
        .insert(budgetData)
        .select()
        .single()

      if (error) {
        console.error('Error setting budget:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in setBudget:', error)
      return null
    }
  }

  static async removeBudget(travelProfileId?: string): Promise<boolean> {
    try {
      // First, let's see what budgets exist for this user/profile
      const userId = await getCurrentUserId()
      let query = supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)

      if (travelProfileId) {
        query = query.eq('travel_profile_id', travelProfileId)
      } else {
        query = query.is('travel_profile_id', null)
      }

      const { data: existingBudgets, error: fetchError } = await query

      if (fetchError) {
        return false
      }

      if (!existingBudgets || existingBudgets.length === 0) {
        return true // Already removed
      }

      // Try to delete each budget individually to see which one fails
      for (const budget of existingBudgets) {
        const { error } = await supabase
          .from('budgets')
          .delete()
          .eq('id', budget.id)

        if (error) {
          return false
        }
      }

      return true
    } catch (error) {
      return false
    }
  }

  // Migration helper to move data from localStorage to Supabase
  static async migrateFromLocalStorage(localData: {
    expenses: Array<{ category: string; amount: number; createdAt: string; updatedAt: string }>
    budget: number
    travelDate?: string
  }): Promise<boolean> {
    try {
      // Migrate budget
      if (localData.budget) {
        await this.setBudget(localData.budget)
      }

      // Migrate expenses
      for (const expense of localData.expenses) {
        await this.addExpense(expense.category, expense.amount)
      }

      // Migrate travel countdown
      if (localData.travelDate) {
        await this.setTravelCountdown(localData.travelDate)
      }

      return true
    } catch (error) {
      console.error('Error migrating from localStorage:', error)
      return false
    }
  }
}
