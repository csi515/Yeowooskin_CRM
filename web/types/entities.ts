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
  skin_type?: string | null
  allergy_info?: string | null
  memo?: string | null
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
  skin_type?: string | null
  allergy_info?: string | null
  memo?: string | null
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
  stock_count?: number
  safety_stock?: number
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
  stock_count?: number
  safety_stock?: number
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
  status?: string | null      // 출근, 휴무 등 현재 상태
  skills?: string | null      // 보유 기술
  incentive_rate?: number | null // 인센티브율 (%)
  profile_image_url?: string | null
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
  status?: string | null
  skills?: string | null
  incentive_rate?: number | null
  profile_image_url?: string | null
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

/**
 * 직원 근태 기록 엔티티
 */
export interface StaffAttendance {
  id: string
  owner_id: string
  staff_id: string
  type: 'scheduled' | 'actual'
  start_time: string
  end_time: string
  status?: string | null  // normal, late, absent 등
  memo?: string | null
  created_at?: string
  updated_at?: string
}

/**
 * 직원 근태 생성/수정 DTO
 */
export interface StaffAttendanceCreateInput {
  staff_id: string
  type: 'scheduled' | 'actual'
  start_time: string
  end_time: string
  status?: string | null
  memo?: string | null
}

export interface StaffAttendanceUpdateInput extends Partial<StaffAttendanceCreateInput> { }

/**
 * 사용자 상태 enum
 */
export type UserStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE'

/**
 * 사용자 역할 enum
 */
export type UserRole = 'pending' | 'user' | 'admin' | 'super_admin'

/**
 * 사용자 엔티티
 */
export interface User {
  id: string
  email: string
  name?: string | null
  phone?: string | null
  birthdate?: string | null
  branch_name?: string | null
  status: UserStatus
  role: UserRole
  approved: boolean
  created_at?: string
}

/**
 * 사용자 상태 업데이트 DTO
 */
export interface UserUpdateInput {
  status?: UserStatus
  role?: UserRole
  approved?: boolean
}

/**
 * 재고 트랜잭션 엔티티
 */
export interface InventoryTransaction {
  id: string
  owner_id: string
  product_id: string
  type: 'purchase' | 'sale' | 'adjustment'
  quantity: number
  before_count?: number
  after_count?: number
  memo?: string | null
  created_at?: string
}

/**
 * 재고 트랜잭션 생성/수정 DTO
 */
export interface InventoryTransactionCreateInput {
  product_id: string
  type: 'purchase' | 'sale' | 'adjustment'
  quantity: number
  before_count?: number
  after_count?: number
  memo?: string | null
}

export interface InventoryTransactionUpdateInput extends Partial<InventoryTransactionCreateInput> { }

/**
 * 재고 알림 엔티티
 */
export interface InventoryAlert {
  id: string
  owner_id: string
  product_id: string
  alert_type: 'low_stock' | 'out_of_stock'
  acknowledged: boolean
  created_at?: string
}

/**
 * 재고 알림 생성/수정 DTO
 */
export interface InventoryAlertCreateInput {
  product_id: string
  alert_type: 'low_stock' | 'out_of_stock'
  acknowledged?: boolean
}

export interface InventoryAlertUpdateInput extends Partial<InventoryAlertCreateInput> { }

/**
 * 급여 설정 엔티티
 */
export interface PayrollSettings {
  id: string
  owner_id: string
  staff_id: string
  base_salary: number
  hourly_rate: number
  national_pension_rate: number
  health_insurance_rate: number
  employment_insurance_rate: number
  income_tax_rate: number
  created_at?: string
  updated_at?: string
}

/**
 * 급여 설정 생성/수정 DTO
 */
export interface PayrollSettingsCreateInput {
  staff_id: string
  base_salary?: number
  hourly_rate?: number
  national_pension_rate?: number
  health_insurance_rate?: number
  employment_insurance_rate?: number
  income_tax_rate?: number
}

export interface PayrollSettingsUpdateInput extends Partial<PayrollSettingsCreateInput> { }

/**
 * 급여 기록 엔티티
 */
export interface PayrollRecord {
  id: string
  owner_id: string
  staff_id: string
  month: string
  base_salary: number
  overtime_pay: number
  incentive_pay: number
  total_gross: number
  national_pension: number
  health_insurance: number
  employment_insurance: number
  income_tax: number
  total_deductions: number
  net_salary: number
  memo?: string | null
  created_at?: string
}

/**
 * 급여 기록 생성/수정 DTO
 */
export interface PayrollRecordCreateInput {
  staff_id: string
  month: string
  base_salary?: number
  overtime_pay?: number
  incentive_pay?: number
  total_gross?: number
  national_pension?: number
  health_insurance?: number
  employment_insurance?: number
  income_tax?: number
  total_deductions?: number
  net_salary?: number
  memo?: string | null
}

export interface PayrollRecordUpdateInput extends Partial<PayrollRecordCreateInput> { }

