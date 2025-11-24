'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Users, Calendar, BarChart3, Settings } from 'lucide-react'
import { useCurrentUser } from '@/app/lib/hooks/useCurrentUser'

export default function MobileBottomNav() {
  const pathname = usePathname() || ''
  const { role } = useCurrentUser()

  const navItems = [
    { href: '/dashboard', icon: Home, label: '대시보드' },
    { href: '/customers', icon: Users, label: '고객' },
    { href: '/appointments', icon: Calendar, label: '예약' },
    ...(role === 'HQ' || role === 'OWNER'
      ? [{ href: '/analytics', icon: BarChart3, label: '통계' }]
      : []),
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-[1020] safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-pink-600' : 'text-neutral-500'
              }`}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

