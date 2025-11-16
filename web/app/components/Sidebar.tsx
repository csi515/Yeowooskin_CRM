'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import type { ReactNode } from 'react'
import { 
  LayoutDashboard, 
  Calendar, 
  Package, 
  Users, 
  UserCheck, 
  DollarSign 
} from 'lucide-react'

type Item = { 
  href: string
  label: string
  icon?: ReactNode
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
  const wrapCls = mobile
    ? 'flex w-72 shrink-0 bg-white border-r border-neutral-200 min-h-screen flex-col shadow-md transition-all duration-300'
    : clsx(
        'hidden md:flex shrink-0 bg-white border-r border-neutral-200 min-h-screen flex-col shadow-md transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )
  
  return (
    <aside className={wrapCls}>
      <div className="px-4 py-4 border-b border-neutral-200 flex items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity duration-300"
          onClick={onNavigate}
          aria-label="여우스킨 CRM 홈"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#F472B6] to-[#EC4899] text-white text-sm font-medium shadow-md border border-[#EC4899]">
            여
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="text-base font-medium text-neutral-900 tracking-tight truncate">
                여우스킨 CRM
              </span>
              <span className="text-xs text-neutral-600">
                운영 대시보드
              </span>
            </div>
          )}
        </Link>
        {!mobile && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg border border-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 hover:border-neutral-300 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-1"
            aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          >
            <svg
              className={clsx(
                'h-5 w-5 transition-transform duration-300',
                collapsed && 'rotate-180'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {items.map(it => {
          const active = pathname?.startsWith(it.href)
          return (
            <Link
              key={it.href}
              href={it.href}
              onClick={onNavigate}
              className={clsx(
                'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-300 cursor-pointer border border-transparent',
                collapsed && 'justify-center',
                active 
                  ? 'bg-[#FDF2F8] text-[#F472B6] shadow-sm font-medium border-neutral-200'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-200'
              )}
              title={collapsed ? it.label : undefined}
              aria-label={it.label}
              aria-current={active ? 'page' : undefined}
            >
              {it.icon && (
                <span
                  className={clsx(
                    'flex-shrink-0 transition-colors duration-300',
                    active 
                      ? 'text-[#F472B6]' 
                      : 'text-neutral-500 group-hover:text-neutral-700'
                  )}
                >
                  {it.icon}
                </span>
              )}
              {!collapsed && (
                <span className="transition-opacity duration-300">
                  {it.label}
                </span>
              )}
              {active && !collapsed && (
                <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1 rounded-r-full bg-[#F472B6]" />
              )}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-neutral-200">
        <form action="/api/auth/logout" method="post">
          <button 
            className={clsx(
              'w-full flex items-center justify-center gap-3 px-3 py-2 rounded-lg text-sm border border-neutral-300 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-400 hover:text-neutral-900 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-1',
              collapsed && 'px-2'
            )}
            title={collapsed ? '로그아웃' : undefined}
            aria-label="로그아웃"
          >
            {!collapsed && '로그아웃'}
          </button>
        </form>
      </div>
    </aside>
  )
}


