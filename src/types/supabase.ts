export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      supermarkets: {
        Row: {
          id: string
          name: string
          address: string
          latitude: number
          longitude: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          latitude: number
          longitude: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          latitude?: number
          longitude?: number
          created_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          supermarket_id: string
          total_amount: number
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          supermarket_id: string
          total_amount: number
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          supermarket_id?: string
          total_amount?: number
          note?: string | null
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          supermarket_id: string
          status: 'pending' | 'completed' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          supermarket_id: string
          status?: 'pending' | 'completed' | 'cancelled'
          created_at?: string
        }
        Update: {
          id?: string
          supermarket_id?: string
          status?: 'pending' | 'completed' | 'cancelled'
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          sale_id: string
          amount: number
          method: 'cash' | 'card' | 'transfer'
          created_at: string
        }
        Insert: {
          id?: string
          sale_id: string
          amount: number
          method: 'cash' | 'card' | 'transfer'
          created_at?: string
        }
        Update: {
          id?: string
          sale_id?: string
          amount?: number
          method?: 'cash' | 'card' | 'transfer'
          created_at?: string
        }
      }
      stock_history: {
        Row: {
          id: string
          product_id: string
          quantity: number
          type: 'in' | 'out'
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity: number
          type: 'in' | 'out'
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          type?: 'in' | 'out'
          reason?: string | null
          created_at?: string
        }
      }
      current_stock: {
        Row: {
          id: string
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity: number
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 