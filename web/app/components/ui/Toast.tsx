'use client'

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import clsx from 'clsx'

type ToastVariant = 'success' | 'error' | 'info' | 'warning'

type Toast = {
  id: string
  title: string
  description?: string
  variant: ToastVariant
  duration?: number
}

type ToastContextType = {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    const newToast: Toast = { ...toast, id, duration: toast.duration || 3000 }
    setToasts((prev) => [...prev, newToast])

    // 자동 제거
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, newToast.duration)

    return () => clearTimeout(timer)
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
    <div className="fixed top-4 right-4 z-[1100] flex flex-col gap-3 max-w-md w-full md:w-auto safe-area-inset-top">
      {toasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
          index={index}
        />
      ))}
    </div>
  )
}

function ToastItem({
  toast,
  onRemove,
  index
}: {
  toast: Toast
  onRemove: (id: string) => void
  index: number
}) {
  const [isExiting, setIsExiting] = useState(false)

  const variantConfig = {
    success: {
      bg: 'bg-emerald-50/90 backdrop-blur-md',
      border: 'border-emerald-200/80',
      text: 'text-emerald-800',
      icon: 'text-emerald-600',
      iconBg: 'bg-emerald-100/80',
      close: 'text-emerald-700 hover:bg-emerald-100/60',
    },
    error: {
      bg: 'bg-rose-50/90 backdrop-blur-md',
      border: 'border-rose-200/80',
      text: 'text-rose-800',
      icon: 'text-rose-600',
      iconBg: 'bg-rose-100/80',
      close: 'text-rose-700 hover:bg-rose-100/60',
    },
    info: {
      bg: 'bg-blue-50/90 backdrop-blur-md',
      border: 'border-blue-200/80',
      text: 'text-blue-800',
      icon: 'text-blue-600',
      iconBg: 'bg-blue-100/80',
      close: 'text-blue-700 hover:bg-blue-100/60',
    },
    warning: {
      bg: 'bg-amber-50/90 backdrop-blur-md',
      border: 'border-amber-200/80',
      text: 'text-amber-800',
      icon: 'text-amber-600',
      iconBg: 'bg-amber-100/80',
      close: 'text-amber-700 hover:bg-amber-100/60',
    },
  }

  const icons = {
    success: <CheckCircle2 className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
  }

  const config = variantConfig[toast.variant]

  const handleRemove = () => {
    setIsExiting(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 300)
  }

  return (
    <div
      className={clsx(
        'relative rounded-2xl border p-4 shadow-2xl transition-all duration-300 ease-out',
        'transform-gpu will-change-transform',
        config.bg,
        config.border,
        isExiting
          ? 'animate-slide-out-right opacity-0 scale-95'
          : 'animate-slide-in-right opacity-100 scale-100',
      )}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* 아이콘 */}
        <div className={clsx(
          'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
          config.iconBg,
          config.icon
        )}>
          {icons[toast.variant]}
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <h4 className={clsx('text-sm font-semibold mb-0.5', config.text)}>
            {toast.title}
          </h4>
          {toast.description && (
            <p className={clsx('text-sm leading-relaxed opacity-90', config.text)}>
              {toast.description}
            </p>
          )}
        </div>

        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={handleRemove}
          className={clsx(
            'flex-shrink-0 p-1.5 rounded-lg transition-all duration-200',
            'hover:scale-110 active:scale-95 touch-manipulation',
            config.close
          )}
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function useAppToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useAppToast must be used within ToastProvider')
  }

  // useMemo로 메모이제이션하여 매번 새로운 객체가 생성되는 것을 방지
  return useMemo(() => ({
    success: (title: string, description?: string) =>
      context.addToast({ title, ...(description ? { description } : {}), variant: 'success', duration: 3000 }),
    error: (title: string, description?: string) =>
      context.addToast({ title, ...(description ? { description } : {}), variant: 'error', duration: 4000 }),
    info: (title: string, description?: string) =>
      context.addToast({ title, ...(description ? { description } : {}), variant: 'info', duration: 3000 }),
    warning: (title: string, description?: string) =>
      context.addToast({ title, ...(description ? { description } : {}), variant: 'warning', duration: 3500 }),
  }), [context])
}
