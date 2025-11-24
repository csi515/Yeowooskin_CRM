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
  DollarSign,
  Settings,
  Building,
  BarChart3,
  Shield,
  History,
  Bell,
  Database,
  Key,
  Activity,
  FileText
} from 'lucide-react'
import LogoutButton from './ui/LogoutButton'
import { useCurrentUser } from '@/app/lib/hooks/useCurrentUser'

type Item = {
  href: string
  label: string
  icon?: ReactNode
  roles?: ('HQ' | 'OWNER' | 'STAFF')[]
}

// 역할별 메뉴 아이템
const getMenuItems = (role: 'HQ' | 'OWNER' | 'STAFF' | null): Item[] => {
  const baseItems: Item[] = []

  if (role === 'HQ') {
    // HQ: 모든 메뉴 + 추가 관리 메뉴
    return [
      { href: '/dashboard', label: '대시보드', icon: <LayoutDashboard className="h-5 w-5" /> },
      { href: '/branches', label: '지점 관리', icon: <Building className="h-5 w-5" /> },
      { href: '/analytics', label: '분석 리포트', icon: <BarChart3 className="h-5 w-5" /> },
      { href: '/appointments', label: '예약', icon: <Calendar className="h-5 w-5" /> },
      { href: '/products', label: '제품', icon: <Package className="h-5 w-5" /> },
      { href: '/customers', label: '고객', icon: <Users className="h-5 w-5" /> },
      { href: '/staff', label: '직원', icon: <UserCheck className="h-5 w-5" /> },
      { href: '/finance', label: '재무', icon: <DollarSign className="h-5 w-5" /> },
      { href: '/settings', label: '설정', icon: <Settings className="h-5 w-5" /> },
      // HQ 전용 관리 메뉴
      { href: '/admin', label: '사용자 승인', icon: <UserCheck className="h-5 w-5" /> },
      { href: '/users', label: '사용자 관리', icon: <Users className="h-5 w-5" /> },
      { href: '/admin/approval-history', label: '승인 히스토리', icon: <History className="h-5 w-5" /> },
      { href: '/admin/statistics', label: '전체 통계', icon: <BarChart3 className="h-5 w-5" /> },
      { href: '/admin/branch-reports', label: '지점별 리포트', icon: <FileText className="h-5 w-5" /> },
      { href: '/admin/notifications', label: '알림 관리', icon: <Bell className="h-5 w-5" /> },
      { href: '/admin/backup', label: '백업 관리', icon: <Database className="h-5 w-5" /> },
      { href: '/admin/permissions', label: '권한 관리', icon: <Shield className="h-5 w-5" /> },
      { href: '/admin/api-keys', label: 'API 키', icon: <Key className="h-5 w-5" /> },
      { href: '/admin/system-status', label: '시스템 상태', icon: <Activity className="h-5 w-5" /> },
    ]
  } else if (role === 'OWNER') {
    // Owner: 재무 포함한 모든 메뉴
    return [
      { href: '/dashboard', label: '대시보드', icon: <LayoutDashboard className="h-5 w-5" /> },
      { href: '/appointments', label: '예약', icon: <Calendar className="h-5 w-5" /> },
      { href: '/products', label: '제품', icon: <Package className="h-5 w-5" /> },
      { href: '/customers', label: '고객', icon: <Users className="h-5 w-5" /> },
      { href: '/staff', label: '직원', icon: <UserCheck className="h-5 w-5" /> },
      { href: '/finance', label: '재무', icon: <DollarSign className="h-5 w-5" /> },
      { href: '/settings', label: '설정', icon: <Settings className="h-5 w-5" /> },
    ]
  } else if (role === 'STAFF') {
    // Staff: 제한된 메뉴 (재무/설정 일부 제한)
    return [
      { href: '/dashboard', label: '대시보드', icon: <LayoutDashboard className="h-5 w-5" /> },
      { href: '/appointments', label: '예약', icon: <Calendar className="h-5 w-5" /> },
      { href: '/products', label: '제품', icon: <Package className="h-5 w-5" /> },
      { href: '/customers', label: '고객', icon: <Users className="h-5 w-5" /> },
      { href: '/settings', label: '설정', icon: <Settings className="h-5 w-5" /> },
    ]
  }

  // 기본 메뉴 (역할 로딩 중)
  return [
    { href: '/dashboard', label: '대시보드', icon: <LayoutDashboard className="h-5 w-5" /> },
  ]
}

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
  const { currentUser, role } = useCurrentUser()
  const menuItems = getMenuItems(role)
  const wrapCls = mobile
    ? 'flex w-72 shrink-0 bg-white border-r border-neutral-200 min-h-screen flex-col shadow-md transition-all duration-300'
    : clsx(
        'hidden md:flex shrink-0 bg-white border-r border-neutral-200 min-h-screen flex-col shadow-md transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )
  
  return (
    <aside className={wrapCls}>
      {/* 헤더 */}
      <div className="px-4 py-4 sm:py-5 border-b border-neutral-200 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity duration-300 touch-manipulation"
          {...(onNavigate && { onClick: onNavigate })}
          aria-label="여우스킨 CRM 홈"
        >
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-gradient-to-br from-[#F472B6] to-[#EC4899] text-white text-sm font-medium shadow-md border border-[#EC4899] flex-shrink-0">
            여
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate min-w-0">
              <span className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight truncate">
                여우스킨 CRM
              </span>
              <span className="text-xs sm:text-sm text-neutral-600 truncate">
                운영 대시보드
              </span>
            </div>
          )}
        </Link>
        {!mobile && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg border border-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 hover:border-neutral-300 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-1 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
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
      
      {/* 네비게이션 */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1 overscroll-contain scroll-smooth">
        {menuItems.map(it => {
          const active = pathname?.startsWith(it.href)
          return (
            <Link
              key={it.href}
              href={it.href}
              {...(onNavigate && { onClick: onNavigate })}
              className={clsx(
                'group relative flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-lg text-sm sm:text-base transition-all duration-300 cursor-pointer border border-transparent touch-manipulation min-h-[48px] sm:min-h-[44px]',
                collapsed && 'justify-center px-2',
                active
                  ? 'bg-[#FDF2F8] text-[#F472B6] shadow-sm font-semibold border-neutral-200'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-200 active:bg-neutral-100'
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
                <span className="transition-opacity duration-300 truncate flex-1">
                  {it.label}
                </span>
              )}
              {active && !collapsed && (
                <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-[#F472B6]" />
              )}
            </Link>
          )
        })}
      </nav>
      
      {/* 푸터 */}
      <div className="p-3 sm:p-4 border-t border-neutral-200">
        <LogoutButton collapsed={collapsed} />
      </div>
    </aside>
  )
}


