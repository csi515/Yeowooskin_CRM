'use client'

import clsx from 'clsx'
import { useRipple } from '@/app/lib/hooks/useRipple'
import { useState } from 'react'
import type { ReactNode } from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'contrast'
  size?: 'sm' | 'md' | 'lg'
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  ripple?: boolean
  loading?: boolean
}

export default function Button({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  leftIcon,
  rightIcon,
  ripple = true,
  disabled,
  loading = false,
  onClick,
  ...rest 
}: Props) {
  const { ripples, addRipple } = useRipple()
  const [isHovered, setIsHovered] = useState(false)

  const base =
    'relative inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation'
  
  const variants: Record<string, string> = {
    // Primary: 저장 버튼 - #4263eb 배경, 호버 #364fc7, white 텍스트
    primary:
      'bg-action-blue-600 hover:bg-action-blue-700 text-white rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] focus-visible:ring-action-blue-300 border-0',
    // Secondary: 취소 버튼 - #6c757d 배경, 호버 #5a6268, white 텍스트
    secondary:
      'bg-cancel-gray-600 hover:bg-cancel-gray-700 text-white rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] focus-visible:ring-cancel-gray-300 border-0',
    // Outline: 투명 배경, 테두리만
    outline:
      'bg-transparent border-2 border-neutral-400 hover:border-neutral-500 text-neutral-700 hover:text-neutral-900 rounded-lg active:scale-[0.98] focus-visible:ring-neutral-300 shadow-sm hover:shadow-md',
    // Ghost: 투명 배경, 호버 시 배경색
    ghost:
      'bg-transparent hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900 rounded-lg active:scale-[0.98] focus-visible:ring-neutral-300',
    // Danger: 삭제 버튼 - 에러 색상
    danger:
      'bg-error-600 hover:bg-error-700 text-white rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] focus-visible:ring-error-300 border-0',
    // Contrast: 대비가 높은 버튼
    contrast:
      'bg-neutral-800 hover:bg-neutral-900 text-white rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] focus-visible:ring-neutral-300 border-0',
  }
  
  const sizes: Record<string, string> = {
    sm: 'h-10 px-4 py-2 text-sm gap-2 min-w-[80px]',
    md: 'h-11 px-5 py-2.5 text-base gap-2 min-w-[100px]', // 최소 h-11, px-5, text-base
    lg: 'h-12 px-6 py-3 text-base gap-2 min-w-[120px]'
  }

  const isDisabled = disabled || loading

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled && ripple) {
      addRipple(e)
    }
    onClick?.(e)
  }

  return (
    <button 
      className={clsx(base, variants[variant], sizes[size], className)} 
      disabled={isDisabled}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-disabled={isDisabled}
      aria-label={rest['aria-label'] || (typeof rest.children === 'string' ? rest.children : undefined)}
      {...rest}
    >
      <span className={clsx('inline-flex items-center gap-inherit', loading && 'opacity-70')}>
        {loading && (
          <span className="flex-shrink-0">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
        )}
        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <span>{rest.children}</span>
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </span>
      {ripples.map((ripple, index) => (
        <span
          key={index}
          className="ripple-effect"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
    </button>
  )
}
