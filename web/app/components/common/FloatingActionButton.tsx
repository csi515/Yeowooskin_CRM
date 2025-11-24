'use client'

import { Plus } from 'lucide-react'

interface FloatingActionButtonProps {
  onClick: () => void
  label: string
  className?: string
  icon?: React.ReactNode
}

export default function FloatingActionButton({ 
  onClick, 
  label,
  className = '',
  icon = <Plus className="h-6 w-6" />
}: FloatingActionButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`md:hidden fixed right-4 bottom-4 h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl hover:shadow-2xl active:scale-[0.95] inline-flex items-center justify-center z-[1000] touch-manipulation transition-all duration-200 safe-area-inset-bottom ${className}`}
      style={{
        bottom: 'calc(1rem + env(safe-area-inset-bottom))',
      }}
    >
      {icon}
    </button>
  )
}

