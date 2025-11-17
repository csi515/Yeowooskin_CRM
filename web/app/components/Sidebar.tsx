'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { 
  LayoutDashboard, 
  Calendar, 
  Package, 
  Users, 
  UserCheck, 
  DollarSign,
  X,
  ChevronLeft
} from 'lucide-react'

type Item = { 
  href: string
  label: string
  icon?: ReactNode
  badge?: number
}

const items: Item[] = [
  { href: '/dashboard', label: '대시보드', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/appointments', label: '예약', icon: <Calendar className="h-5 w-5" /> },
  { href: '/products', label: '제품', icon: <Package className="h-5 w-5" /> },
  { href: '/customers', label: '고객', icon: <Users className="h-5 w-5" /> },
  { href: '/staff', label: '직원', icon: <UserCheck className="h-5 w-5" /> },
  { href: '/finance', label: '재무', icon: <DollarSign className="h-5 w-5" /> },
]

type Props = {
  mobile?: boolean
  onNavigate?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export default function Sidebar({ 
  mobile = false, 
  onNavigate,
  collapsed = false,
  onToggleCollapse 
}: Props = {}) {
  const pathname = usePathname()
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    const checkTablet = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024)
    }
    checkTablet()
    window.addEventListener('resize', checkTablet)
    return () => window.removeEventListener('resize', checkTablet)
  }, [])

  const wrapCls = mobile
    ? 'flex w-80 max-w-[85vw] shrink-0 bg-white border-r border-neutral-200 min-h-screen flex-col shadow-xl transition-all duration-300'
    : clsx(
        'hidden md:flex shrink-0 bg-white border-r border-neutral-200 min-h-screen flex-col shadow-md transition-all duration-300',
        collapsed ? 'w-20' : 'w-64',
        isTablet && !collapsed && 'w-56'
      )
  
  return (
    <aside className={wrapCls} aria-label="주요 네비게이션">
      {/* 헤더 */}
      <div className="px-4 py-4 md:py-5 border-b border-neutral-200 flex items-center justify-between gap-2">
        {mobile && (
          <button
            onClick={onNavigate}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors focus-visible:ring-2 focus-visible:ring-secondary-400"
            aria-label="메뉴 닫기"
          >
            <X className="h-5 w-5 text-neutral-700" />
          </button>
        )}
        <Link 
          href="/" 
          className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity duration-300 flex-1"
          onClick={onNavigate}
          aria-label="여우스킨 CRM 홈"
        >
          <div className="flex h-10 w-10 md:h-9 md:w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#F472B6] to-[#EC4899] text-white text-sm font-semibold shadow-md border border-[#EC4899] flex-shrink-0">
            여
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate min-w-0">
              <span className="text-base md:text-lg font-semibold text-neutral-900 tracking-tight truncate">
                여우스킨 CRM
              </span>
              <span className="text-xs text-neutral-600 truncate">
                운영 대시보드
              </span>
            </div>
          )}
        </Link>
        {!mobile && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg border border-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 hover:border-neutral-300 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-offset-1 flex-shrink-0"
            aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
            aria-expanded={!collapsed}
          >
            <ChevronLeft
              className={clsx(
                'h-5 w-5 transition-transform duration-300',
                collapsed && 'rotate-180'
              )}
            />
          </button>
        )}
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1" aria-label="주요 메뉴">
        {items.map(it => {
          const active = pathname?.startsWith(it.href)
          return (
            <Link
              key={it.href}
              href={it.href}
              onClick={onNavigate}
              className={clsx(
                'group relative flex items-center gap-3 px-3 py-2.5 md:py-3 rounded-lg text-sm md:text-base transition-all duration-200 cursor-pointer border border-transparent touch-manipulation',
                collapsed && 'justify-center px-2',
                active 
                  ? 'bg-secondary-50 text-secondary-700 shadow-sm font-semibold border-secondary-200'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-200'
              )}
              title={collapsed ? it.label : undefined}
              aria-label={it.label}
              aria-current={active ? 'page' : undefined}
            >
              {it.icon && (
                <span
                  className={clsx(
                    'flex-shrink-0 transition-colors duration-200',
                    active 
                      ? 'text-secondary-600' 
                      : 'text-neutral-500 group-hover:text-neutral-700'
                  )}
                  aria-hidden="true"
                >
                  {it.icon}
                </span>
              )}
              {!collapsed && (
                <span className="transition-opacity duration-200 truncate flex-1">
                  {it.label}
                </span>
              )}
              {it.badge && !collapsed && (
                <span className="flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full bg-secondary-600 text-white">
                  {it.badge}
                </span>
              )}
              {active && !collapsed && (
                <span 
                  className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-secondary-600"
                  aria-hidden="true"
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* 푸터 */}
      <div className="p-3 md:p-4 border-t border-neutral-200">
        <form action="/api/auth/logout" method="post">
          <button 
            type="submit"
            className={clsx(
              'w-full flex items-center justify-center gap-3 px-3 py-2.5 md:py-3 rounded-lg text-sm md:text-base border border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 hover:text-neutral-900 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-offset-1 touch-manipulation',
              collapsed && 'px-2'
            )}
            title={collapsed ? '로그아웃' : undefined}
            aria-label="로그아웃"
          >
            {!collapsed && <span>로그아웃</span>}
            {collapsed && <X className="h-5 w-5" />}
          </button>
        </form>
      </div>
    </aside>
  )
}
