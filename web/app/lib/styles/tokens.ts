/**
 * 디자인 토큰 시스템
 * 일관된 디자인을 위한 중앙화된 토큰 정의
 */

/**
 * 색상 팔레트
 */
export const colors = {
  // Primary (Brand) - 로즈/핑크 계열
  primary: {
    50: '#FFF1F4',
    100: '#FFE4EA',
    200: '#FFC7D3',
    300: '#FFAFBF',
    400: '#FF8DA6',
    500: '#FF8DA6',
    600: '#F46E8A',
    700: '#E25779',
    800: '#C94563',
    900: '#A7364D',
  },
  // Secondary (Blue) - 주요 액션
  secondary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  // Neutral - 텍스트, 배경, 테두리
  neutral: {
    50: '#FDF7F8',
    100: '#F5EFF1',
    200: '#E8DDE1',
    300: '#D1C4CA',
    400: '#7A808A',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#1C1A1B',
  },
  // Success
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  // Warning
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  // Error/Danger
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
} as const

/**
 * 타이포그래피 스케일
 */
export const typography = {
  fontFamily: {
    sans: ['Pretendard', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
    mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],      // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const

/**
 * 간격 시스템 (4px 기준)
 */
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const

/**
 * Border Radius 시스템
 */
export const borderRadius = {
  none: '0',
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.25rem', // 20px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const

/**
 * Shadow 시스템
 */
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  soft: '0 8px 28px rgba(228, 120, 150, 0.12)',
  brand: '0 4px 12px rgba(244, 110, 138, 0.15)',
} as const

/**
 * Transition/Timing 시스템
 */
export const transitions = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  timing: {
    ease: 'ease',
    'ease-in': 'ease-in',
    'ease-out': 'ease-out',
    'ease-in-out': 'ease-in-out',
  },
} as const

/**
 * Z-Index 시스템
 */
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const

/**
 * Breakpoints
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

/**
 * 버튼 토큰
 */
export const button = {
  heights: {
    sm: '36px',  // h-9
    md: '40px',  // h-10
    lg: '44px',  // h-11
  },
  padding: {
    sm: '0.75rem',   // px-3
    md: '1rem',      // px-4
    lg: '1.25rem',   // px-5
  },
  gap: '0.5rem',  // gap-2 (8px)
  minGap: '0.5rem',  // 버튼 그룹 간 최소 간격
} as const

/**
 * 입력 필드 토큰
 */
export const input = {
  height: '40px',  // h-10
  labelGap: '0.5rem',  // mb-2 (8px)
  errorGap: '0.25rem',  // mt-1 (4px)
  placeholderColor: '#64748B',  // neutral-500
  iconSize: '16px',  // h-4 w-4
  iconGap: '0.75rem',  // pl-10, pr-10 (12px)
} as const

/**
 * 카드 및 컨테이너 토큰
 */
export const card = {
  padding: {
    default: '1.25rem',  // p-5 (20px)
    compact: '1rem',     // p-4 (16px)
  },
  gap: '1rem',  // gap-4 (16px)
  sectionGap: '2rem',  // space-y-8 (32px)
} as const

/**
 * 링크 토큰
 */
export const link = {
  color: '#2563EB',  // secondary-600
  hoverColor: '#1D4ED8',  // secondary-700
} as const

