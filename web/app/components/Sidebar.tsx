'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Package,
  Users,
  UserCheck,
  DollarSign,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Home
} from 'lucide-react'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Divider,
  Tooltip,
  Paper,
  useTheme,
  alpha
} from '@mui/material'
import LogoutButton from './ui/LogoutButton'
import { useIsAdmin } from '@/app/lib/hooks/useUserRole'
import { useShopName } from '@/app/lib/hooks/useShopName'

type Item = {
  href: string
  label: string
  icon: React.ElementType
}

const items: Item[] = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/appointments', label: '예약', icon: Calendar },
  { href: '/products', label: '제품', icon: Package },
  { href: '/customers', label: '고객', icon: Users },
  { href: '/staff', label: '직원', icon: UserCheck },
  { href: '/finance', label: '재무', icon: DollarSign },
  { href: '/settings', label: '설정', icon: Settings },
  { href: '/', label: 'BeautyHub 홈', icon: Home },
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
  const isAdmin = useIsAdmin()
  const theme = useTheme()
  const shopName = useShopName()

  const sidebarWidth = collapsed ? 80 : 256

  return (
    <Paper
      component="aside"
      elevation={0}
      sx={{
        position: mobile ? 'relative' : 'fixed',
        top: 0,
        left: 0,
        width: mobile ? 288 : sidebarWidth,
        flexShrink: 0,
        display: mobile ? 'flex' : { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        height: '100vh',
        borderRight: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        overflowX: 'hidden',
        zIndex: theme.zIndex.drawer,
      }}
    >
      {/* 헤더 */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 64,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
          {!collapsed && (
            <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Typography variant="subtitle1" fontWeight="bold" noWrap color="text.primary">
                {shopName}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                운영 대시보드
              </Typography>
            </Box>
          )}
        </Box>
        {!mobile && onToggleCollapse && (
          <IconButton
            onClick={onToggleCollapse}
            size="small"
            aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
            sx={{
              ml: collapsed ? 'auto' : 0,
              mr: collapsed ? 'auto' : 0
            }}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </IconButton>
        )}
      </Box>

      {/* 네비게이션 */}
      <List
        component="nav"
        sx={{
          flex: 1,
          px: 1,
          py: 2,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { display: 'none' }, // 스크롤바 숨김 (선택사항)
        }}
      >
        {items.map((item) => {
          const active = pathname?.startsWith(item.href)
          const Icon = item.icon

          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={collapsed ? item.label : ''} placement="right" arrow>
                {/* @ts-expect-error - Next.js Link component type mismatch with MUI */}
                <ListItemButton
                  component={Link}
                  href={item.href}
                  onClick={onNavigate}
                  selected={active}
                  sx={{
                    minHeight: 44,
                    justifyContent: collapsed ? 'center' : 'initial',
                    borderRadius: 2, // 8px (theme.shape.borderRadius)
                    px: 1.5,
                    color: active ? 'primary.main' : 'text.primary',
                    bgcolor: active ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                    '&:hover': {
                      bgcolor: active
                        ? alpha(theme.palette.primary.main, 0.12)
                        : alpha(theme.palette.text.primary, 0.04),
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 0 : 2,
                      justifyContent: 'center',
                      color: active ? 'primary.main' : 'text.secondary',
                    }}
                  >
                    <Icon size={20} />
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: active ? 600 : 400
                      }}
                    />
                  )}
                  {active && !collapsed && (
                    <Box
                      sx={{
                        width: 4,
                        height: 32,
                        bgcolor: 'primary.main',
                        position: 'absolute',
                        right: 0,
                        borderTopLeftRadius: 4,
                        borderBottomLeftRadius: 4
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          )
        })}

        {/* 관리자 메뉴 */}
        {isAdmin && (
          <>
            <Divider sx={{ my: 1, mx: 1 }} />
            <ListItem disablePadding>
              <Tooltip title={collapsed ? '사용자 관리' : ''} placement="right" arrow>
                {/* @ts-expect-error - Next.js Link component type mismatch with component prop */}
                <ListItemButton
                  component={Link}
                  href="/admin"
                  onClick={onNavigate}
                  selected={pathname?.startsWith('/admin')}
                  sx={{
                    minHeight: 44,
                    justifyContent: collapsed ? 'center' : 'initial',
                    borderRadius: 2,
                    px: 1.5,
                    color: pathname?.startsWith('/admin') ? 'primary.main' : 'text.primary',
                    bgcolor: pathname?.startsWith('/admin') ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                    '&:hover': {
                      bgcolor: pathname?.startsWith('/admin')
                        ? alpha(theme.palette.primary.main, 0.12)
                        : alpha(theme.palette.text.primary, 0.04),
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 0 : 2,
                      justifyContent: 'center',
                      color: pathname?.startsWith('/admin') ? 'primary.main' : 'text.secondary',
                    }}
                  >
                    <Shield size={20} />
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary="사용자 관리"
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: pathname?.startsWith('/admin') ? 600 : 400
                      }}
                    />
                  )}
                  {pathname?.startsWith('/admin') && !collapsed && (
                    <Box
                      sx={{
                        width: 4,
                        height: 32,
                        bgcolor: 'primary.main',
                        position: 'absolute',
                        right: 0,
                        borderTopLeftRadius: 4,
                        borderBottomLeftRadius: 4
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          </>
        )}
      </List>

      {/* 푸터 */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <LogoutButton collapsed={collapsed} />
      </Box>
    </Paper>
  )
}
