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
    'relative inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus-visible:ring-[2px] focus-visible:ring-offset-2 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants: Record<string, string> = {
    // Primary: 로즈 핑크 배경, 흰색 텍스트 (저장 버튼용) - 인라인 스타일로 색상 적용
    primary:
      'rounded-lg border-2 active:scale-[0.99] focus-visible:ring-pink-300 shadow-md hover:shadow-lg',
    // Secondary: 흰색 배경, 로즈 핑크 테두리 (취소 버튼용) - 인라인 스타일로 색상 적용
    secondary:
      'rounded-lg border-2 active:scale-[0.99] focus-visible:ring-pink-300 shadow-sm hover:shadow-md',
    // Outline: 투명 배경, 로즈 핑크 테두리 - 인라인 스타일로 색상 적용
    outline:
      'rounded-lg border-2 active:scale-[0.99] focus-visible:ring-pink-300',
    // Ghost: 투명 배경, 호버 시 로즈 핑크 배경 - 인라인 스타일로 색상 적용
    ghost:
      'rounded-lg active:scale-[0.99] focus-visible:ring-pink-300',
    // Danger: 흰색 배경, 부드러운 로즈 테두리 (삭제 버튼용) - 인라인 스타일로 색상 적용
    danger:
      'rounded-lg border-2 active:scale-[0.99] focus-visible:ring-rose-300 shadow-sm hover:shadow-md',
    // Contrast: 흰색 배경, 로즈 핑크 테두리 - 인라인 스타일로 색상 적용
    contrast:
      'rounded-lg border-2 active:scale-[0.99] focus-visible:ring-pink-300 shadow-sm hover:shadow-md',
  }
  
  const sizes: Record<string, string> = {
    sm: 'h-10 px-5 py-2.5 text-sm gap-2 min-w-[80px]',
    md: 'h-12 px-8 py-3 text-base gap-2 min-w-[100px]',
    lg: 'h-14 px-10 py-3.5 text-lg gap-2 min-w-[120px]'
  }

  const isDisabled = disabled || loading

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled && ripple) {
      addRipple(e)
    }
    onClick?.(e)
  }

  const getStyle = () => {
    const roseColor = '#F472B6' // 로즈 핑크
    const roseHover = '#EC4899' // 진한 로즈 핑크
    const roseLight = '#FBCFE8' // 밝은 로즈
    const dangerColor = '#FCA5A5' // 부드러운 로즈 (에러)
    const dangerHover = '#FB7185' // 진한 부드러운 로즈
    
    if (variant === 'primary') {
      // 로즈 핑크 배경 → 흰 글자, 그라데이션 효과
      return { 
        background: isHovered 
          ? `linear-gradient(135deg, ${roseHover} 0%, ${roseColor} 100%)`
          : `linear-gradient(135deg, ${roseColor} 0%, ${roseLight} 100%)`,
        borderColor: isHovered ? roseHover : roseColor, 
        color: '#ffffff' 
      }
    }
    if (variant === 'secondary' || variant === 'contrast') {
      // 흰 배경 → 검은 글자, 호버 시 로즈 핑크 배경 → 흰 글자
      return { 
        backgroundColor: isHovered ? roseColor : '#ffffff', 
        borderColor: roseColor, 
        color: isHovered ? '#ffffff' : '#1C1A1B' 
      }
    }
    if (variant === 'danger') {
      // 흰 배경 → 검은 글자, 호버 시 부드러운 로즈 배경 → 흰 글자
      return { 
        backgroundColor: isHovered ? dangerColor : '#ffffff', 
        borderColor: dangerColor, 
        color: isHovered ? '#ffffff' : '#1C1A1B' 
      }
    }
    if (variant === 'outline') {
      // 기본: 투명 배경 + 로즈 핑크 글자, 호버: 로즈 핑크 배경 + 흰 글자
      return { 
        backgroundColor: isHovered ? roseColor : 'transparent', 
        borderColor: roseColor, 
        color: isHovered ? '#ffffff' : roseColor 
      }
    }
    if (variant === 'ghost') {
      // 기본: 투명 배경 + 로즈 핑크 글자, 호버: 로즈 핑크 배경 + 흰 글자
      return { 
        backgroundColor: isHovered ? roseColor : 'transparent', 
        borderColor: 'transparent', 
        color: isHovered ? '#ffffff' : roseColor 
      }
    }
    return {}
  }

  return (
    <button 
      className={clsx(base, variants[variant], sizes[size], className)} 
      style={getStyle()}
      disabled={isDisabled}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-disabled={isDisabled}
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


