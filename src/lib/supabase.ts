import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          gloop_count: number
          daily_gloop_count: number
          last_daily_reset: string
          gloop_boosts: number
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          gloop_count?: number
          daily_gloop_count?: number
          last_daily_reset?: string
          gloop_boosts?: number
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          gloop_count?: number
          daily_gloop_count?: number
          last_daily_reset?: string
          gloop_boosts?: number
          created_at?: string
        }
      }
      gloops: {
        Row: {
          id: string
          user_id: string
          gloop_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          gloop_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          gloop_count?: number
          created_at?: string
        }
      }
      invite_links: {
        Row: {
          id: string
          user_id: string
          code: string
          uses: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          code: string
          uses?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          code?: string
          uses?: number
          created_at?: string
        }
      }
    }
  }
}