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
      customers: {
        Row: {
          id: string
          owner_id: string
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
          customer_id: string | null
          staff_id: string | null
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
          customer_id?: string | null
          staff_id?: string | null
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
          customer_id?: string | null
          staff_id?: string | null
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
          expense_date?: string
          amount?: number
          category?: string
          memo?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

