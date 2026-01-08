'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'

import { useTheme } from '@mui/material'
import { useMediaQuery } from '@mui/material'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import MobileBottomNav from './MobileBottomNav'
import OfflineIndicator from './OfflineIndicator'
import PullToRefresh from './ui/PullToRefresh'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const isPublic =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/reset-password') ||
    pathname === '/update-password' ||
    pathname === '/features' ||
    pathname.startsWith('/guides') ||
    pathname === '/faq' ||
    pathname === '/privacy-policy' ||
    pathname === '/terms-of-service'

  const [navOpen, setNavOpen] = useState(false)

  // Collapse state for desktop with localStorage persistence
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed')
      return saved === 'true'
    }
    return false
  })

  const toggleCollapse = () => {
    const newState = !collapsed
    setCollapsed(newState)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', String(newState))
    }
  }

  // ESC key handler is handled by MUI Modal/Drawer by default for mobile

  if (isPublic) {
    return <>{children}</>
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={navOpen}
          onClose={() => setNavOpen(false)}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 288 },
          }}
        >
          <Sidebar mobile onNavigate={() => setNavOpen(false)} />
        </Drawer>
      )}

      {/* Main Content */}
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        ml: { xs: 0, md: collapsed ? '80px' : '256px' },
        transition: theme.transitions.create('margin', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}>
        <TopBar onMenu={() => setNavOpen(true)} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 1.5, sm: 2, md: 3, lg: 4 },
            pb: { xs: 10, md: 3 }, // Extra padding for mobile bottom nav (64px + 16px = 80px)
            overflowX: 'hidden',
            width: '100%',
            maxWidth: '100%'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {isMobile ? (
              <PullToRefresh>
                {children}
              </PullToRefresh>
            ) : (
              children
            )}
          </Box>
        </Box>
      </Box>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Offline Indicator */}
      <OfflineIndicator />
    </Box>
  )
}
