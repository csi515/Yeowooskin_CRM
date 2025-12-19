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
    pathname === '/update-password'

  const [navOpen, setNavOpen] = useState(false)

  // Collapse state for desktop
  const [collapsed, setCollapsed] = useState(false)

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
          onToggleCollapse={() => setCollapsed(!collapsed)}
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
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar onMenu={() => setNavOpen(true)} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3, md: 3, lg: 4 },
            pb: { xs: 14, md: 3 }, // Extra padding for mobile bottom nav
            overflowX: 'hidden'
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
