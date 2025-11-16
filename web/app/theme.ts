import { extendTheme } from '@chakra-ui/react'

const colors = {
  neutral: {
    950: '#0F172A',
    900: '#111827',
    800: '#1F2937',
    700: '#374151',
    600: '#4B5563',
    500: '#6B7280',
    400: '#9CA3AF',
    300: '#CBD5F1',
    200: '#E5E7EB',
    100: '#F3F4F6',
    50: '#F9FAFB'
  },
  brand: {
    900: '#9F1239',
    700: '#E11D48',
    600: '#FB7185',
    500: '#FDA4AF',
    400: '#FECDD3',
    300: '#FFE4E6',
    100: '#FFF1F2',
    50: '#FFF7F9'
  }
}

const components = {
  Button: {
    baseStyle: { borderRadius: 'lg', fontWeight: 600 },
    sizes: { md: { h: 10, px: 4 } },
    variants: {
      solid: { bg: 'brand.600', color: 'white', _hover: { bg: 'brand.700' } },
      ghost: { bg: 'neutral.50', _hover: { bg: 'neutral.100' } }
    }
  },
  Input: {
    baseStyle: { field: { borderRadius: 'lg' } },
    variants: {
      outline: {
        field: {
          borderColor: 'neutral.200',
          _focus: { borderColor: 'brand.400', boxShadow: '0 0 0 3px rgba(167,139,250,.35)' }
        }
      }
    }
  }
}

const theme = extendTheme({
  fonts: {
    heading: 'Pretendard, Inter, system-ui, -apple-system, Segoe UI, sans-serif',
    body: 'Pretendard, Inter, system-ui, -apple-system, Segoe UI, sans-serif'
  },
  colors,
  radii: { md: '10px', lg: '14px', xl: '18px' },
  shadows: { sm: '0 4px 16px rgba(17,17,19,0.06)' },
  components
})

export default theme

