'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'

type ToastType = 'success' | 'error' | 'info' | 'warning'

type Toast = {
  id: string
  message: string
  description?: string
  type: ToastType
  duration?: number
}

type ToastContextType = {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { ...toast, id }])
    
    // 자동 제거
    const duration = toast.duration ?? (toast.type === 'error' ? 5000 : 3000)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-[1100] flex flex-col gap-3 pointer-events-none max-w-sm w-full sm:max-w-md px-4 sm:px-0"
      aria-live="polite"
      aria-label="알림"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false)

  const handleRemove = () => {
    setIsExiting(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 200)
  }

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-600" />,
    error: <AlertCircle className="h-5 w-5 text-error-600" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning-600" />,
    info: <Info className="h-5 w-5 text-secondary-600" />,
  }

  const styles = {
    success: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    error: 'bg-error-50 border-error-300 text-error-900',
    warning: 'bg-warning-50 border-warning-300 text-warning-900',
    info: 'bg-secondary-50 border-secondary-300 text-secondary-900',
  }

  return (
    <div
      className={clsx(
        'pointer-events-auto rounded-xl border-2 shadow-xl p-4 flex items-start gap-3 animate-slide-in-right backdrop-blur-sm',
        styles[toast.type],
        isExiting && 'opacity-0 translate-x-full transition-all duration-200'
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{toast.message}</p>
        {toast.description && (
          <p className="text-xs mt-1 opacity-90 leading-relaxed">{toast.description}</p>
        )}
      </div>
      <button
        onClick={handleRemove}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors touch-manipulation"
        aria-label="닫기"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function useAppToast() {
  const context = useContext(ToastContext)
  
  // Fallback: Context가 없을 때 기본 구현 (Chakra UI와 호환)
  if (!context) {
    // Chakra UI의 useToast를 시도
    try {
      const { useToast: chakraUseToast } = require('@chakra-ui/react')
      const toast = chakraUseToast()
      const base = { position: 'top' as const, isClosable: true }
      return {
        success: (title: string, description?: string) =>
          toast({ ...base, title, description, status: 'success', duration: 3000 }),
        error: (title: string, description?: string) =>
          toast({ ...base, title, description, status: 'error', duration: 5000 }),
        info: (title: string, description?: string) =>
          toast({ ...base, title, description, status: 'info', duration: 3000 }),
        warning: (title: string, description?: string) =>
          toast({ ...base, title, description, status: 'warning', duration: 3000 })
      }
    } catch {
      // Chakra UI도 없으면 콘솔 로그
      return {
        success: (title: string, description?: string) => {
          console.log('✅', title, description)
        },
        error: (title: string, description?: string) => {
          console.error('❌', title, description)
        },
        info: (title: string, description?: string) => {
          console.info('ℹ️', title, description)
        },
        warning: (title: string, description?: string) => {
          console.warn('⚠️', title, description)
        }
      }
    }
  }

  return {
    success: (title: string, description?: string) =>
      context.addToast({ message: title, description, type: 'success' }),
    error: (title: string, description?: string) =>
      context.addToast({ message: title, description, type: 'error', duration: 5000 }),
    info: (title: string, description?: string) =>
      context.addToast({ message: title, description, type: 'info' }),
    warning: (title: string, description?: string) =>
      context.addToast({ message: title, description, type: 'warning' })
  }
}
