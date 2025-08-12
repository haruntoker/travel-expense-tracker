import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a singleton Supabase client to prevent multiple instances
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const supabase = (() => {
  if (supabaseInstance) {
    console.log('🔄 Reusing existing Supabase client instance')
    return supabaseInstance
  }
  
  console.log('🆕 Creating new Supabase client instance')
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
  return supabaseInstance
})()

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      travel_profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      travel_countdowns: {
        Row: {
          id: string
          user_id: string
          travel_profile_id: string | null
          travel_date: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          travel_profile_id?: string | null
          travel_date: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          travel_profile_id?: string | null
          travel_date?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          travel_profile_id: string | null
          category: string
          amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          travel_profile_id?: string | null
          category: string
          amount: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          travel_profile_id?: string | null
          category?: string
          amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          travel_profile_id: string | null
          amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          travel_profile_id?: string | null
          amount: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          travel_profile_id?: string | null
          amount?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
