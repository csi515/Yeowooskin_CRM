/**
 * 도메인 엔티티 타입 정의
 */

/**
 * 지점 엔티티
 */
export interface Branch {
  id: string
  code: string
  name: string
  address?: string | null
  phone?: string | null
  owner_id?: string | null
  created_by?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

/**
 * 지점 생성/수정 DTO
 */
export interface BranchCreateInput {
  code: string
  name: string
  address?: string | null
  phone?: string | null
}

export interface BranchUpdateInput extends Partial<BranchCreateInput> {}

/**
 * 사용자 프로필 엔티티
 */
export interface Profile {
  id: string
  email: string
  name?: string | null
  phone?: string | null
  role: 'HQ' | 'OWNER' | 'STAFF'
  branch_id?: string | null
  invite_code?: string | null
  invite_expires_at?: string | null
  approved: boolean
  approved_by?: string | null
  approved_at?: string | null
  created_at?: string
  updated_at?: string
}

/**
 * 초대 엔티티
 */
export interface Invitation {
  id: string
  email: string
  role: 'OWNER' | 'STAFF'
  branch_id: string
  invite_code: string
  invited_by?: string | null
  expires_at: string
  used_at?: string | null
  used_by?: string | null
  created_at?: string
}

/**
 * 초대 생성 DTO
 */
export interface InvitationCreateInput {
  email: string
  role: 'OWNER' | 'STAFF'
  branch_id: string
}

/**
 * 고객 엔티티
 */
export interface Customer {
  id: string
  owner_id: string
  branch_id?: string | null
  name: string
  phone?: string | null
  email?: string | null
  address?: string | null
  features?: string | null
  // 건강 정보
  health_allergies?: string | null
  health_medications?: string | null
  health_skin_conditions?: string | null
  health_pregnant?: boolean | null
  health_breastfeeding?: boolean | null
  health_notes?: string | null
  // 피부 정보
  skin_type?: string | null // 민감성, 건조, 지성, 복합성
  skin_concerns?: string[] | null // 여드름, 기미, 주름, 모공, 색소침착 등
  // 재방문 관리
  birthdate?: string | null
  last_visit_date?: string | null
  recommended_visit_interval_days?: number | null
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
  health_allergies?: string | null
  health_medications?: string | null
  health_skin_conditions?: string | null
  health_pregnant?: boolean | null
  health_breastfeeding?: boolean | null
  health_notes?: string | null
  skin_type?: string | null
  skin_concerns?: string[] | null
  birthdate?: string | null
  recommended_visit_interval_days?: number | null
}

export interface CustomerUpdateInput extends Partial<CustomerCreateInput> {}

/**
 * 상품/서비스 엔티티
 */
export interface Product {
  id: string
  owner_id: string
  branch_id?: string | null
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

export interface ProductUpdateInput extends Partial<ProductCreateInput> {}

/**
 * 직원 엔티티
 */
export interface Staff {
  id: string
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

export interface StaffUpdateInput extends Partial<StaffCreateInput> {}

/**
 * 예약 엔티티
 */
export interface Appointment {
  id: string
  owner_id: string
  branch_id?: string | null
  customer_id?: string | null
  staff_id?: string | null
  service_id?: string | null
  room_id?: string | null
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
  room_id?: string | null
}

export interface AppointmentCreateInputExtended extends AppointmentCreateInput {
  service_id?: string | null
}

export interface AppointmentUpdateInput extends Partial<AppointmentCreateInput> {}

/**
 * 시술 기록 엔티티
 */
export interface TreatmentRecord {
  id: string
  owner_id: string
  branch_id?: string | null
  customer_id: string
  appointment_id?: string | null
  staff_id?: string | null
  treatment_name: string
  treatment_content?: string | null
  skin_condition_before?: string | null
  skin_condition_after?: string | null
  notes?: string | null
  before_images?: string[] | null
  after_images?: string[] | null
  treatment_date: string
  created_at?: string
  updated_at?: string
}

/**
 * 시술 기록 생성/수정 DTO
 */
export interface TreatmentRecordCreateInput {
  customer_id: string
  appointment_id?: string | null
  staff_id?: string | null
  treatment_name: string
  treatment_content?: string | null
  skin_condition_before?: string | null
  skin_condition_after?: string | null
  notes?: string | null
  before_images?: string[] | null
  after_images?: string[] | null
  treatment_date?: string
}

export interface TreatmentRecordUpdateInput extends Partial<TreatmentRecordCreateInput> {}

/**
 * 시술 프로그램 엔티티
 */
export interface TreatmentProgram {
  id: string
  owner_id: string
  branch_id?: string | null
  customer_id: string
  program_name: string
  total_sessions: number
  completed_sessions: number
  product_id?: string | null
  started_at: string
  completed_at?: string | null
  expires_at?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
}

/**
 * 시술 프로그램 생성/수정 DTO
 */
export interface TreatmentProgramCreateInput {
  customer_id: string
  program_name: string
  total_sessions: number
  product_id?: string | null
  expires_at?: string | null
  notes?: string | null
}

export interface TreatmentProgramUpdateInput extends Partial<TreatmentProgramCreateInput> {}

/**
 * 시술 프로그램 세션 엔티티
 */
export interface TreatmentProgramSession {
  id: string
  program_id: string
  treatment_record_id?: string | null
  appointment_id?: string | null
  session_number: number
  session_date: string
  notes?: string | null
  created_at?: string
}

/**
 * 시술실 엔티티
 */
export interface TreatmentRoom {
  id: string
  owner_id: string
  branch_id?: string | null
  name: string
  code?: string | null
  description?: string | null
  capacity: number
  active: boolean
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

/**
 * 시술실 생성/수정 DTO
 */
export interface TreatmentRoomCreateInput {
  name: string
  code?: string | null
  description?: string | null
  capacity?: number
  active?: boolean
}

export interface TreatmentRoomUpdateInput extends Partial<TreatmentRoomCreateInput> {}

/**
 * 거래 엔티티
 */
export interface Transaction {
  id: string
  owner_id: string
  branch_id?: string | null
  appointment_id?: string | null
  customer_id?: string | null
  type?: string
  amount: number
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
  payment_method?: string | null
  transaction_date?: string
  notes?: string | null
}

export interface TransactionUpdateInput extends Partial<TransactionCreateInput> {}

/**
 * 지출 엔티티
 */
export interface Expense {
  id: string
  owner_id: string
  branch_id?: string | null
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

export interface ExpenseUpdateInput extends Partial<ExpenseCreateInput> {}

/**
 * 고객 포인트
 */
export interface CustomerPoint {
  customer_id: string
  balance: number
}

/**
 * 권한 정의
 */
export interface Permission {
  id: string
  code: string
  name: string
  description?: string | null
  category: string
  created_at?: string
}

/**
 * 역할별 권한 매핑
 */
export interface RolePermission {
  id: string
  role: 'HQ' | 'OWNER' | 'STAFF'
  permission_id: string
  created_at?: string
}

/**
 * 사용자별 추가 권한
 */
export interface UserPermission {
  id: string
  user_id: string
  permission_id: string
  granted: boolean
  granted_by?: string | null
  granted_at: string
  expires_at?: string | null
  reason?: string | null
}

/**
 * 승인 요청
 */
export interface Approval {
  id: string
  request_type: string
  request_data: Record<string, unknown>
  requested_by: string
  approved_by?: string | null
  approved_at?: string | null
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string | null
  created_at?: string
  updated_at?: string
}

/**
 * 고객 상품 보유 정보
 */
export interface CustomerProduct {
  id: string
  customer_id: string
  product_id: string
  branch_id?: string | null
  quantity: number
  notes?: string | null
  created_at?: string
  updated_at?: string
}

/**
 * 고객 상품 변동 이력
 */
export interface CustomerProductLedger {
  id: string
  customer_product_id: string
  delta: number
  reason: string
  created_by?: string | null
  created_at?: string
}

