/**
 * API 요청/응답 타입 정의
 */

import type {
  Customer,
  Product,
  Staff,
  Appointment,
  Transaction,
  Expense,
  CustomerCreateInput,
  CustomerUpdateInput,
  ProductCreateInput,
  ProductUpdateInput,
  StaffCreateInput,
  StaffUpdateInput,
  AppointmentCreateInput,
  AppointmentUpdateInput,
  TransactionCreateInput,
  TransactionUpdateInput,
  ExpenseCreateInput,
  ExpenseUpdateInput,
} from './entities'
import type { PaginationParams, SearchParams, DateRangeParams } from './common'

/**
 * 고객 API 요청/응답
 */
export interface CustomersListQuery extends PaginationParams, SearchParams {}
export type CustomersListResponse = Customer[]
export type CustomerDetailResponse = Customer
export type CustomerCreateRequest = CustomerCreateInput
export type CustomerUpdateRequest = CustomerUpdateInput

/**
 * 상품 API 요청/응답
 */
export interface ProductsListQuery extends PaginationParams, SearchParams {}
export type ProductsListResponse = Product[]
export type ProductDetailResponse = Product
export type ProductCreateRequest = ProductCreateInput
export type ProductUpdateRequest = ProductUpdateInput

/**
 * 직원 API 요청/응답
 */
export interface StaffListQuery extends PaginationParams, SearchParams {}
export type StaffListResponse = Staff[]
export type StaffDetailResponse = Staff
export type StaffCreateRequest = StaffCreateInput
export type StaffUpdateRequest = StaffUpdateInput

/**
 * 예약 API 요청/응답
 */
export interface AppointmentsListQuery extends PaginationParams, DateRangeParams {}
export type AppointmentsListResponse = Appointment[]
export type AppointmentDetailResponse = Appointment
export type AppointmentCreateRequest = AppointmentCreateInput
export type AppointmentUpdateRequest = AppointmentUpdateInput

/**
 * 거래 API 요청/응답
 */
export interface TransactionsListQuery extends PaginationParams {
  customer_id?: string
}
export type TransactionsListResponse = Transaction[]
export type TransactionDetailResponse = Transaction
export type TransactionCreateRequest = TransactionCreateInput
export type TransactionUpdateRequest = TransactionUpdateInput

/**
 * 지출 API 요청/응답
 */
export interface ExpensesListQuery extends PaginationParams, DateRangeParams {}
export type ExpensesListResponse = Expense[]
export type ExpenseDetailResponse = Expense
export type ExpenseCreateRequest = ExpenseCreateInput
export type ExpenseUpdateRequest = ExpenseUpdateInput

