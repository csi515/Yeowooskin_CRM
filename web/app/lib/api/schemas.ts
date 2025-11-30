/**
 * Zod 기반 요청 스키마
 */

import { z } from 'zod'

/**
 * 페이지네이션 스키마
 */
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).default(50),
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
 * 값이 이상하더라도 입력되도록 매우 관대한 검증
 */
export const staffCreateSchema = z.object({
  name: z.string().min(1, '이름은 필수입니다'),
  phone: z.union([z.string(), z.literal(''), z.null()]).optional().nullable(),
  email: z.union([z.string(), z.literal(''), z.null()]).optional().nullable(),
  role: z.union([z.string(), z.literal(''), z.null()]).optional().nullable(),
  notes: z.union([z.string(), z.literal(''), z.null()]).optional().nullable(),
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
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)'),
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
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)'),
  category: z.string().optional().nullable(),
  // notes 필드는 데이터베이스에 컬럼이 없으므로 제외
  // notes: z.string().optional().nullable(),
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

