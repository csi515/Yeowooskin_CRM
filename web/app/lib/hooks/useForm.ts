'use client'

/**
 * 폼 상태 및 검증 관리 훅
 */

import { useState, useCallback, useMemo } from 'react'
import { getValidationError } from '../utils/validation'

export type ValidationRules<T> = {
  [K in keyof T]?: {
    required?: boolean
    email?: boolean
    phone?: boolean
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    custom?: (val: unknown) => string | null
  }
}

export type UseFormOptions<T> = {
  initialValues: T
  validationRules?: ValidationRules<T>
  onSubmit?: (values: T) => void | Promise<void>
}

export type UseFormReturn<T> = {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  dirty: boolean
  isValid: boolean
  setValue: <K extends keyof T>(field: K, value: T[K]) => void
  setValues: (values: Partial<T>) => void
  setError: <K extends keyof T>(field: K, error: string | null) => void
  setTouched: <K extends keyof T>(field: K, touched: boolean) => void
  validate: () => boolean
  validateField: <K extends keyof T>(field: K) => boolean
  reset: () => void
  handleSubmit: (e?: React.FormEvent) => Promise<void>
}

/**
 * 폼 상태 및 검증 관리 훅
 *
 * @example
 * const { values, errors, setValue, handleSubmit } = useForm({
 *   initialValues: { name: '', email: '' },
 *   validationRules: {
 *     name: { required: true, minLength: 2 },
 *     email: { required: true, email: true },
 *   },
 *   onSubmit: async (values) => {
 *     await api.create(values)
 *   },
 * })
 */
export function useForm<T extends Record<string, unknown>>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  const { initialValues, validationRules = {}, onSubmit } = options

  const [values, setValuesState] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({})

  // 더티 체크: 초기값과 다른지 확인
  const dirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues)
  }, [values, initialValues])

  // 유효성 검사
  const isValid = useMemo(() => {
    return (Object.keys(validationRules) as Array<keyof T>).every((field) => {
      const rules = (validationRules as ValidationRules<T>)[field]
      if (!rules) return true
      const error = getValidationError(String(field), values[field], rules)
      return !error
    })
  }, [values, validationRules])

  // 단일 필드 값 설정
  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValuesState((prev) => ({ ...prev, [field]: value }))
    // 값 변경 시 에러 초기화 (필드가 터치된 경우에만)
    if (touched[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }, [touched])

  // 여러 필드 값 설정
  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState((prev) => ({ ...prev, ...newValues }))
  }, [])

  // 에러 설정
  const setError = useCallback(<K extends keyof T>(field: K, error: string | null) => {
    setErrors((prev) => {
      if (error === null) {
        const next = { ...prev }
        delete next[field]
        return next
      }
      return { ...prev, [field]: error }
    })
  }, [])

  // 터치 상태 설정
  const setTouched = useCallback(<K extends keyof T>(field: K, touchedValue: boolean) => {
    setTouchedState((prev) => ({ ...prev, [field]: touchedValue }))
  }, [])

  // 단일 필드 검증
  const validateField = useCallback(<K extends keyof T>(field: K): boolean => {
    const rules = (validationRules as ValidationRules<T>)[field]
    if (!rules) return true
    const error = getValidationError(String(field), values[field], rules)
    if (error) {
      setError(field, error)
      return false
    }
    setError(field, null)
    return true
  }, [values, validationRules, setError])

  // 전체 폼 검증
  const validate = useCallback((): boolean => {
    let isValid = true
    const newErrors: Partial<Record<keyof T, string>> = {}

    Object.keys(validationRules).forEach((key) => {
      const field = key as keyof T
      const rules = (validationRules as ValidationRules<T>)[field]
      if (!rules) return
      const error = getValidationError(String(field), values[field], rules)
      if (error) {
        newErrors[field] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [values, validationRules])

  // 폼 리셋
  const reset = useCallback(() => {
    setValuesState(initialValues)
    setErrors({})
    setTouchedState({})
  }, [initialValues])

  // 제출 핸들러
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    // 모든 필드를 터치 상태로 표시
    const allTouched: Partial<Record<keyof T, boolean>> = {}
    Object.keys(validationRules).forEach((key) => {
      allTouched[key as keyof T] = true
    })
    setTouchedState(allTouched)

    // 검증 실패 시 제출 중단
    if (!validate()) {
      return
    }

    // onSubmit 실행
    if (onSubmit) {
      await onSubmit(values)
    }
  }, [values, validationRules, validate, onSubmit])

  return {
    values,
    errors,
    touched,
    dirty,
    isValid,
    setValue,
    setValues,
    setError,
    setTouched,
    validate,
    validateField,
    reset,
    handleSubmit,
  }
}
