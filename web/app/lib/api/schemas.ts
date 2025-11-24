/**
 * Zod 기반 요청 스키마
 */

import { z } from 'zod'

/**
 * 페이지네이션 스키마
 */
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50), // 최대값 200으로 제한 (데이터 보호)
  offset: z.coerce.number().int().min(0).default(0),
})

/**
 * 검색 스키마
 */
export const searchSchema = z.object({
  search: z.string().optional(),
})

/**
 * 날짜 범위 스키마
 */
export const dateRangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
})

/**
 * 쿼리 파라미터 통합 스키마
 */
export const queryParamsSchema = paginationSchema.merge(searchSchema).merge(dateRangeSchema)

/**
 * 고객 생성 스키마
 */
export const customerCreateSchema = z.object({
  name: z.string().min(1, '이름은 필수입니다'),
  phone: z.string().optional(),
  email: z.string().email('유효한 이메일을 입력하세요').optional().or(z.literal('')),
  address: z.string().optional(),
  features: z.string().optional().nullable(),
  health_allergies: z.string().optional().nullable(),
  health_medications: z.string().optional().nullable(),
  health_skin_conditions: z.string().optional().nullable(),
  health_pregnant: z.boolean().optional().nullable(),
  health_breastfeeding: z.boolean().optional().nullable(),
  health_notes: z.string().optional().nullable(),
  skin_type: z.string().optional().nullable(),
  skin_concerns: z.array(z.string()).optional().nullable(),
  birthdate: z.string().optional().nullable(),
  recommended_visit_interval_days: z.number().int().optional().nullable(),
})

/**
 * 고객 업데이트 스키마
 */
export const customerUpdateSchema = customerCreateSchema.partial()

/**
 * 상품 생성 스키마
 */
export const productCreateSchema = z.object({
  name: z.string().min(1, '상품명은 필수입니다'),
  price: z.coerce.number().min(0, '가격은 0 이상이어야 합니다').optional(),
  description: z.string().optional().nullable(),
  active: z.boolean().optional().default(true),
})

/**
 * 상품 업데이트 스키마
 */
export const productUpdateSchema = productCreateSchema.partial()

/**
 * 직원 생성 스키마
 */
export const staffCreateSchema = z.object({
  name: z.string().min(1, '이름은 필수입니다'),
  phone: z.string().optional().nullable(),
  email: z.string().email('유효한 이메일을 입력하세요').optional().or(z.literal('')).nullable(),
  role: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  active: z.boolean().optional().default(true),
})

/**
 * 직원 업데이트 스키마
 */
export const staffUpdateSchema = staffCreateSchema.partial()

/**
 * 예약 생성 스키마
 */
export const appointmentCreateSchema = z.object({
  appointment_date: z.string().datetime('올바른 날짜 형식이 아닙니다'),
  customer_id: z.string().uuid('올바른 고객 ID가 아닙니다').optional().nullable(),
  staff_id: z.string().uuid('올바른 직원 ID가 아닙니다').optional().nullable(),
  service_id: z.string().uuid('올바른 서비스 ID가 아닙니다').optional().nullable(),
  status: z.enum(['scheduled', 'pending', 'cancelled', 'complete']).optional().default('scheduled'),
  notes: z.string().optional().nullable(),
})

/**
 * 예약 업데이트 스키마
 */
export const appointmentUpdateSchema = appointmentCreateSchema.partial()

/**
 * 지출 생성 스키마
 */
export const expenseCreateSchema = z.object({
  amount: z.coerce.number().min(0, '금액은 0 이상이어야 합니다'),
  expense_date: z.string().datetime('올바른 날짜 형식이 아닙니다'),
  category: z.string().min(1, '카테고리는 필수입니다'),
  memo: z.string().optional().nullable(),
})

/**
 * 지출 업데이트 스키마
 */
export const expenseUpdateSchema = expenseCreateSchema.partial()

/**
 * 거래 생성 스키마
 */
export const transactionCreateSchema = z.object({
  customer_id: z.string().uuid('올바른 고객 ID가 아닙니다').optional().nullable(),
  amount: z.coerce.number().min(0, '금액은 0 이상이어야 합니다'),
  transaction_date: z.string().datetime('올바른 날짜 형식이 아닙니다'),
  notes: z.string().optional().nullable(),
})

/**
 * 거래 업데이트 스키마
 */
export const transactionUpdateSchema = transactionCreateSchema.partial()

/**
 * 포인트 ledger 생성 스키마
 */
export const pointsLedgerCreateSchema = z.object({
  delta: z.coerce.number().refine((val) => val !== 0, {
    message: 'delta는 0이 아닌 값이어야 합니다',
  }),
  reason: z.string().optional(),
})

/**
 * 고객 상품 보유 내역 생성 스키마
 */
export const customerProductCreateSchema = z.object({
  customer_id: z.string().uuid('올바른 고객 ID가 아닙니다'),
  product_id: z.string().uuid('올바른 상품 ID가 아닙니다'),
  quantity: z.coerce.number().int().min(0, '수량은 0 이상이어야 합니다'),
  notes: z.string().optional().nullable(),
  reason: z.string().optional(),
})

/**
 * 고객 상품 보유 내역 업데이트 스키마
 */
export const customerProductUpdateSchema = z.object({
  quantity: z.coerce.number().int().min(0, '수량은 0 이상이어야 합니다'),
  notes: z.string().optional().nullable(),
  reason: z.string().max(500, '사유는 500자 이하여야 합니다').optional(),
  no_ledger: z.boolean().optional(),
})

/**
 * 고객 상품 ledger 항목 추가 스키마
 */
export const customerProductLedgerCreateSchema = z.object({
  delta: z.coerce.number().int().refine((val) => val !== 0, {
    message: 'delta는 0이 아닌 값이어야 합니다',
  }),
  reason: z.string().max(500, '사유는 500자 이하여야 합니다').optional(),
})

/**
 * 고객 상품 ledger 항목 업데이트 스키마
 */
export const customerProductLedgerUpdateSchema = z.object({
  replace_from: z.string().optional(),
  replace_to: z.string().optional(),
  delta_override: z.coerce.number().int().optional(),
})

/**
 * 초대 생성 스키마
 */
export const invitationCreateSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  role: z.enum(['OWNER', 'STAFF'], {
    errorMap: () => ({ message: '역할은 OWNER 또는 STAFF여야 합니다' })
  }),
  branch_id: z.string().uuid('올바른 지점 ID가 아닙니다').optional(),
})

/**
 * 지점 생성 스키마
 */
export const branchCreateSchema = z.object({
  code: z.string().min(1, '지점 코드는 필수입니다'),
  name: z.string().min(1, '지점명은 필수입니다'),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
})

/**
 * 지점 업데이트 스키마
 */
export const branchUpdateSchema = branchCreateSchema.partial()

