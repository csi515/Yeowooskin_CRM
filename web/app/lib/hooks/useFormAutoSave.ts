import { useEffect, useRef } from 'react'
import { useLocalStorage } from './useLocalStorage'

type UseFormAutoSaveOptions<T> = {
  formKey: string
  data: T
  enabled?: boolean
  debounceMs?: number
}

export function useFormAutoSave<T>({
  formKey,
  data,
  enabled = true,
  debounceMs = 1000
}: UseFormAutoSaveOptions<T>) {
  const [savedData, setSavedData] = useLocalStorage<T | null>(`form-autosave-${formKey}`, null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!enabled) return

    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setSavedData(data)
    }, debounceMs)

    return () => {
      clearTimeout(timeoutRef.current)
    }
  }, [data, enabled, debounceMs, setSavedData])

  const clearSaved = () => {
    setSavedData(null)
  }

  return {
    savedData,
    clearSaved,
    restore: () => savedData
  }
}
