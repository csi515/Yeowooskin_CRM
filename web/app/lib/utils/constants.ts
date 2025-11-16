/**
 * 공통 상수 정의
 */

export const PAGINATION_SIZES = [10, 20, 50] as const
export const DEFAULT_PAGE_SIZE = 10
export const DEFAULT_PAGE = 1

export const DATE_FORMAT = 'YYYY-MM-DD'
export const TIME_FORMAT = 'HH:mm'
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm'

export const STATUS_FILTERS = {
  ALL: 'all',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const

export const DENSITY_OPTIONS = {
  COMPACT: 'compact',
  COMFORTABLE: 'comfortable',
} as const

export const VIEW_MODES = {
  TABLE: 'table',
  CARD: 'card',
} as const

