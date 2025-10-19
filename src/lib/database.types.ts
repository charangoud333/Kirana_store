export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          role: 'owner' | 'cashier' | 'helper'
          full_name: string
          phone: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'owner' | 'cashier' | 'helper'
          full_name: string
          phone?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'owner' | 'cashier' | 'helper'
          full_name?: string
          phone?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      suppliers: {
        Row: {
          id: string
          name: string
          contact_number: string | null
          email: string | null
          address: string | null
          outstanding_balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_number?: string | null
          email?: string | null
          address?: string | null
          outstanding_balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_number?: string | null
          email?: string | null
          address?: string | null
          outstanding_balance?: number
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          contact_number: string | null
          address: string | null
          credit_limit: number
          outstanding_balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_number?: string | null
          address?: string | null
          credit_limit?: number
          outstanding_balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_number?: string | null
          address?: string | null
          credit_limit?: number
          outstanding_balance?: number
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          category: string | null
          brand: string | null
          unit: string
          quantity: number
          buying_price: number
          selling_price: number
          supplier_id: string | null
          reorder_level: number
          expiry_date: string | null
          sku: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          brand?: string | null
          unit?: string
          quantity?: number
          buying_price: number
          selling_price: number
          supplier_id?: string | null
          reorder_level?: number
          expiry_date?: string | null
          sku?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string | null
          brand?: string | null
          unit?: string
          quantity?: number
          buying_price?: number
          selling_price?: number
          supplier_id?: string | null
          reorder_level?: number
          expiry_date?: string | null
          sku?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      purchases: {
        Row: {
          id: string
          product_id: string
          supplier_id: string | null
          quantity: number
          cost_price: number
          total_amount: number
          invoice_number: string | null
          purchase_date: string
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          supplier_id?: string | null
          quantity: number
          cost_price: number
          total_amount: number
          invoice_number?: string | null
          purchase_date?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          supplier_id?: string | null
          quantity?: number
          cost_price?: number
          total_amount?: number
          invoice_number?: string | null
          purchase_date?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          bill_number: string
          sale_date: string
          payment_type: 'cash' | 'upi' | 'credit'
          customer_id: string | null
          total_amount: number
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bill_number: string
          sale_date?: string
          payment_type?: 'cash' | 'upi' | 'credit'
          customer_id?: string | null
          total_amount: number
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bill_number?: string
          sale_date?: string
          payment_type?: 'cash' | 'upi' | 'credit'
          customer_id?: string | null
          total_amount?: number
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sale_items: {
        Row: {
          id: string
          sale_id: string
          product_id: string
          quantity: number
          sale_price: number
          total_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          sale_id: string
          product_id: string
          quantity: number
          sale_price: number
          total_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          sale_id?: string
          product_id?: string
          quantity?: number
          sale_price?: number
          total_amount?: number
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          expense_type: 'rent' | 'electricity' | 'wages' | 'delivery' | 'misc'
          description: string
          amount: number
          expense_date: string
          payment_method: 'cash' | 'upi' | 'bank'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          expense_type: 'rent' | 'electricity' | 'wages' | 'delivery' | 'misc'
          description: string
          amount: number
          expense_date?: string
          payment_method?: 'cash' | 'upi' | 'bank'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          expense_type?: 'rent' | 'electricity' | 'wages' | 'delivery' | 'misc'
          description?: string
          amount?: number
          expense_date?: string
          payment_method?: 'cash' | 'upi' | 'bank'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          payment_type: 'supplier_payment' | 'customer_payment'
          supplier_id: string | null
          customer_id: string | null
          amount: number
          payment_method: 'cash' | 'upi' | 'bank'
          payment_date: string
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          payment_type: 'supplier_payment' | 'customer_payment'
          supplier_id?: string | null
          customer_id?: string | null
          amount: number
          payment_method?: 'cash' | 'upi' | 'bank'
          payment_date?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          payment_type?: 'supplier_payment' | 'customer_payment'
          supplier_id?: string | null
          customer_id?: string | null
          amount?: number
          payment_method?: 'cash' | 'upi' | 'bank'
          payment_date?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      store_settings: {
        Row: {
          id: string
          store_name: string
          store_address: string | null
          store_phone: string | null
          store_email: string | null
          currency_symbol: string
          low_stock_threshold: number
          tax_rate: number
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          store_name?: string
          store_address?: string | null
          store_phone?: string | null
          store_email?: string | null
          currency_symbol?: string
          low_stock_threshold?: number
          tax_rate?: number
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          store_name?: string
          store_address?: string | null
          store_phone?: string | null
          store_email?: string | null
          currency_symbol?: string
          low_stock_threshold?: number
          tax_rate?: number
          logo_url?: string | null
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

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
