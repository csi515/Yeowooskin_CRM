/**
 * 도메인 엔티티 타입 정의
 */

/**
 * 고객 엔티티
 */
export interface Customer {
  id: string
  owner_id: string
  name: string
  phone?: string | null
  email?: string | null
  address?: string | null
  features?: string | null
  created_at?: string
  updated_at?: string
}

/**
 * 고객 생성/수정 DTO
 */
export interface CustomerCreateInput {
  name: string
  phone?: string | null
  email?: string | null
  address?: string | null
  features?: string | null
}

export interface CustomerUpdateInput extends Partial<CustomerCreateInput> { }

/**
 * 상품/서비스 엔티티
 */
export interface Product {
  id: string
  owner_id: string
  name: string
  price: number
  description?: string | null
  active?: boolean
  created_at?: string
  updated_at?: string
}

/**
 * 상품 생성/수정 DTO
 */
export interface ProductCreateInput {
  name: string
  price?: number
  description?: string | null
  active?: boolean
}

export interface ProductUpdateInput extends Partial<ProductCreateInput> { }

/**
 * 직원 엔티티
 */
export interface Staff {
  id: string
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

/**
 * 직원 생성/수정 DTO
 */
export interface StaffCreateInput {
  name: string
  phone?: string | null
  email?: string | null
  role?: string | null
  notes?: string | null
  active?: boolean
}

export interface StaffUpdateInput extends Partial<StaffCreateInput> { }

/**
 * 예약 엔티티
 */
export interface Appointment {
  id: string
  owner_id: string
  customer_id?: string | null
  staff_id?: string | null
  service_id?: string | null
  appointment_date: string
  status?: string
  total_price?: number | null
  notes?: string | null
  created_at?: string
  updated_at?: string
}

/**
 * 예약 생성/수정 DTO
 */
export interface AppointmentCreateInput {
  customer_id?: string | null
  staff_id?: string | null
  appointment_date: string
  status?: string
  total_price?: number | null
  notes?: string | null
}

export interface AppointmentCreateInputExtended extends AppointmentCreateInput {
  service_id?: string | null
}

export interface AppointmentUpdateInput extends Partial<AppointmentCreateInput> { }

/**
 * 거래 엔티티
 */
export interface Transaction {
  id: string
  owner_id: string
  appointment_id?: string | null
  customer_id?: string | null
  type?: string
  amount: number
  category?: string
  payment_method?: string | null
  transaction_date?: string
  notes?: string | null
  created_at?: string
}

/**
 * 거래 생성/수정 DTO
 */
export interface TransactionCreateInput {
  appointment_id?: string | null
  customer_id?: string | null
  type?: string
  amount: number
  category?: string
  payment_method?: string | null
  transaction_date?: string
  notes?: string | null
}

export interface TransactionUpdateInput extends Partial<TransactionCreateInput> { }

/**
 * 지출 엔티티
 */
export interface Expense {
  id: string
  owner_id: string
  expense_date: string
  amount: number
  category: string
  memo?: string | null
  created_at?: string
  updated_at?: string
}

/**
 * 지출 생성/수정 DTO
 */
export interface ExpenseCreateInput {
  expense_date: string
  amount: number
  category: string
  memo?: string | null
}

export interface ExpenseUpdateInput extends Partial<ExpenseCreateInput> { }

/**
 * 고객 상품 보유 내역
 */
export interface CustomerProduct {
  id: string
  customer_id: string
  product_id: string
  quantity: number
  notes?: string | null
  created_at?: string
  updated_at?: string
}

/**
 * 고객 포인트
 */
export interface CustomerPoint {
  customer_id: string
  balance: number
}

