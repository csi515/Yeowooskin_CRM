/**
 * CustomerDetailModal 상태 관리 커스텀 훅
 */

import { useState, useEffect } from 'react'
import type { Customer } from '@/types/entities'

export interface UseCustomerDetailOptions {
  item: Customer | null
  onSaved?: () => void
  onDeleted?: () => void
}

export interface UseCustomerDetailReturn {
  form: Customer | null
  setForm: React.Dispatch<React.SetStateAction<Customer | null>>
  loading: boolean
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  error: string
  setError: React.Dispatch<React.SetStateAction<string>>
  features: string
  setFeatures: React.Dispatch<React.SetStateAction<string>>
}

/**
 * 고객 상세 모달의 상태 관리 훅
 */
export function useCustomerDetail({ item }: UseCustomerDetailOptions): UseCustomerDetailReturn {
  const [form, setForm] = useState<Customer | null>(item)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [features, setFeatures] = useState<string>('')

  useEffect(() => {
    setForm(item)
    setFeatures((item as any)?.features || '')
  }, [item])

  return {
    form,
    setForm,
    loading,
    setLoading,
    error,
    setError,
    features,
    setFeatures,
  }
}

