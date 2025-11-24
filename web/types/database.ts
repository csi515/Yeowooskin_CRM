/**
 * Supabase 데이터베이스 타입 정의
 * 
 * 향후 `supabase gen types typescript --project-id <project-id>` 명령으로
 * 자동 생성된 타입을 여기에 추가할 수 있습니다.
 * 
 * 현재는 수동으로 정의된 타입을 사용합니다.
 */

/**
 * 데이터베이스 스키마 타입
 * Supabase 자동 생성 타입이 있으면 여기에 추가
 */
export type Database = {
  public: {
    Tables: {
      branches: {
        Row: {
          id: string
          code: string
          name: string
          address: string | null
          phone: string | null
          owner_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          code: string
          name: string
          address?: string | null
          phone?: string | null
          owner_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          address?: string | null
          phone?: string | null
          owner_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          phone: string | null
          role: 'HQ' | 'OWNER' | 'STAFF'
          branch_id: string | null
          invite_code: string | null
          invite_expires_at: string | null
          approved: boolean
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          phone?: string | null
          role?: 'HQ' | 'OWNER' | 'STAFF'
          branch_id?: string | null
          invite_code?: string | null
          invite_expires_at?: string | null
          approved?: boolean
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          phone?: string | null
          role?: 'HQ' | 'OWNER' | 'STAFF'
          branch_id?: string | null
          invite_code?: string | null
          invite_expires_at?: string | null
          approved?: boolean
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invitations: {
        Row: {
          id: string
          email: string
          role: 'OWNER' | 'STAFF'
          branch_id: string
          invite_code: string
          invited_by: string | null
          expires_at: string
          used_at: string | null
          used_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role: 'OWNER' | 'STAFF'
          branch_id: string
          invite_code: string
          invited_by?: string | null
          expires_at?: string
          used_at?: string | null
          used_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'OWNER' | 'STAFF'
          branch_id?: string
          invite_code?: string
          invited_by?: string | null
          expires_at?: string
          used_at?: string | null
          used_by?: string | null
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          owner_id: string
          branch_id: string | null
          name: string
          phone: string | null
          email: string | null
          address: string | null
          features: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          branch_id?: string | null
          name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          features?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          branch_id?: string | null
          name?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          features?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          owner_id: string
          branch_id: string | null
          name: string
          price: number
          description: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          branch_id?: string | null
          name: string
          price: number
          description?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          branch_id?: string | null
          name?: string
          price?: number
          description?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      staff: {
        Row: {
          id: string
          owner_id: string
          branch_id: string | null
          name: string
          phone: string | null
          email: string | null
          role: string | null
          notes: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          branch_id?: string | null
          name: string
          phone?: string | null
          email?: string | null
          role?: string | null
          notes?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          branch_id?: string | null
          name?: string
          phone?: string | null
          email?: string | null
          role?: string | null
          notes?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          owner_id: string
          branch_id: string | null
          customer_id: string | null
          staff_id: string | null
          service_id: string | null
          appointment_date: string
          status: string | null
          total_price: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          branch_id?: string | null
          customer_id?: string | null
          staff_id?: string | null
          service_id?: string | null
          appointment_date: string
          status?: string | null
          total_price?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          branch_id?: string | null
          customer_id?: string | null
          staff_id?: string | null
          service_id?: string | null
          appointment_date?: string
          status?: string | null
          total_price?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          owner_id: string
          branch_id: string | null
          appointment_id: string | null
          customer_id: string | null
          type: string | null
          amount: number
          payment_method: string | null
          transaction_date: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          branch_id?: string | null
          appointment_id?: string | null
          customer_id?: string | null
          type?: string | null
          amount: number
          payment_method?: string | null
          transaction_date?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          branch_id?: string | null
          appointment_id?: string | null
          customer_id?: string | null
          type?: string | null
          amount?: number
          payment_method?: string | null
          transaction_date?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          owner_id: string
          branch_id: string | null
          expense_date: string
          amount: number
          category: string
          memo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          branch_id?: string | null
          expense_date: string
          amount: number
          category: string
          memo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          branch_id?: string | null
          expense_date?: string
          amount?: number
          category?: string
          memo?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      permissions: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          category: string
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
          category: string
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
          category?: string
          created_at?: string
        }
      }
      role_permissions: {
        Row: {
          id: string
          role: 'HQ' | 'OWNER' | 'STAFF'
          permission_id: string
          created_at: string
        }
        Insert: {
          id?: string
          role: 'HQ' | 'OWNER' | 'STAFF'
          permission_id: string
          created_at?: string
        }
        Update: {
          id?: string
          role?: 'HQ' | 'OWNER' | 'STAFF'
          permission_id?: string
          created_at?: string
        }
      }
      user_permissions: {
        Row: {
          id: string
          user_id: string
          permission_id: string
          granted: boolean
          granted_by: string | null
          granted_at: string
          expires_at: string | null
          reason: string | null
        }
        Insert: {
          id?: string
          user_id: string
          permission_id: string
          granted?: boolean
          granted_by?: string | null
          granted_at?: string
          expires_at?: string | null
          reason?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          permission_id?: string
          granted?: boolean
          granted_by?: string | null
          granted_at?: string
          expires_at?: string | null
          reason?: string | null
        }
      }
      approvals: {
        Row: {
          id: string
          request_type: string
          request_data: Record<string, unknown>
          requested_by: string
          approved_by: string | null
          approved_at: string | null
          status: 'pending' | 'approved' | 'rejected'
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          request_type: string
          request_data: Record<string, unknown>
          requested_by: string
          approved_by?: string | null
          approved_at?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          request_type?: string
          request_data?: Record<string, unknown>
          requested_by?: string
          approved_by?: string | null
          approved_at?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customer_products: {
        Row: {
          id: string
          customer_id: string
          product_id: string
          branch_id: string
          quantity: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          product_id: string
          branch_id: string
          quantity: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          product_id?: string
          branch_id?: string
          quantity?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customer_product_ledger: {
        Row: {
          id: string
          customer_product_id: string
          delta: number
          reason: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_product_id: string
          delta: number
          reason: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_product_id?: string
          delta?: number
          reason?: string
          created_by?: string | null
          created_at?: string
        }
      }
    }
  }
}

