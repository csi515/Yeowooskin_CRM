'use client'

import { ToastPosition, useToast } from '@chakra-ui/react'

export function useAppToast() {
  const toast = useToast()
  const base: { position: ToastPosition; isClosable: boolean } = {
    position: 'top',
    isClosable: true,
  }
  return {
    success: (title: string, description?: string) =>
      toast({ ...base, title, description, status: 'success', duration: 2200 }),
    error: (title: string, description?: string) =>
      toast({ ...base, title, description, status: 'error', duration: 2600 }),
    info: (title: string, description?: string) =>
      toast({ ...base, title, description, status: 'info', duration: 2200 }),
    warning: (title: string, description?: string) =>
      toast({ ...base, title, description, status: 'warning', duration: 2200 })
  }
}


