/**
 * Customer 페이지 관련 타입 정의
 */

export type CustomerStatusFilter = 'all' | 'active' | 'inactive'
export type CustomerVipFilter = 'all' | 'vip' | 'normal'

export interface CustomerFilters {
  statusFilter: CustomerStatusFilter
  vipFilter: CustomerVipFilter
  minPoints: string
  maxPoints: string
}

export interface CustomerPageState {
  loading: boolean
  error: string
  selectedCustomerIds: string[]
  pointsByCustomer: Record<string, number>
}
