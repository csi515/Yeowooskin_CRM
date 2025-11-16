'use client'

import { ChakraProvider } from '@chakra-ui/react'
import theme from './theme'
import { ThemeProvider } from './lib/context/ThemeContext'
import { AuthProvider } from './components/AuthProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ChakraProvider theme={theme}>{children}</ChakraProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}


