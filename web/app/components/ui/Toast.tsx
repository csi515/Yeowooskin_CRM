'use client'

import { useEffect, useState } from 'react'
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

const ToastContext = React.createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { ...toast, id }])
    
    // 자동 제거
    const duration = toast.duration ?? 5000
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div
      className="fixed bottom-4 right-4 z-[1100] flex flex-col gap-2 pointer-events-none max-w-sm w-full sm:max-w-md"
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
    }, 300)
  }

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-600" />,
    error: <AlertCircle className="h-5 w-5 text-error-600" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning-600" />,
    info: <Info className="h-5 w-5 text-secondary-600" />,
  }

  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    error: 'bg-error-50 border-error-200 text-error-900',
    warning: 'bg-warning-50 border-warning-200 text-warning-900',
    info: 'bg-secondary-50 border-secondary-200 text-secondary-900',
  }

  return (
    <div
      className={clsx(
        'pointer-events-auto rounded-lg border-2 shadow-lg p-4 flex items-start gap-3 animate-slide-in-right',
        styles[toast.type],
        isExiting && 'animate-slide-out-right'
      )}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{toast.message}</p>
        {toast.description && (
          <p className="text-xs mt-1 opacity-90">{toast.description}</p>
        )}
      </div>
      <button
        onClick={handleRemove}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
        aria-label="닫기"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
