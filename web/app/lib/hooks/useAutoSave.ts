import { useEffect, useRef } from 'react'
import { useDebounce } from './useDebounce'

type AutoSaveOptions = {
  delay?: number
  onSave: (data: any) => Promise<void> | void
  enabled?: boolean
}

export function useAutoSave<T>(data: T, options: AutoSaveOptions) {
  const { delay = 2000, onSave, enabled = true } = options
  const debouncedData = useDebounce(data, delay)
  const lastSavedRef = useRef<string>('')
  const isSavingRef = useRef(false)

  useEffect(() => {
    if (!enabled || isSavingRef.current) return

    const dataString = JSON.stringify(debouncedData)
    if (dataString === lastSavedRef.current) return

    isSavingRef.current = true
    Promise.resolve(onSave(debouncedData))
      .then(() => {
        lastSavedRef.current = dataString
      })
      .catch((error) => {
        console.error('Auto-save failed:', error)
      })
      .finally(() => {
        isSavingRef.current = false
      })
  }, [debouncedData, onSave, enabled])

  return {
    isSaving: isSavingRef.current
  }
}
