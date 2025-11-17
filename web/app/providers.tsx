'use client'

import { ChakraProvider } from '@chakra-ui/react'
import theme from './theme'
import { ThemeProvider } from './lib/context/ThemeContext'
import { AuthProvider } from './components/AuthProvider'
import { ToastProvider } from './lib/ui/toast'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ChakraProvider theme={theme}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ChakraProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}


