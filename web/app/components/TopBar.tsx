'use client'

import { Menu, Settings } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material'

export default function TopBar({ onMenu }: { onMenu?: () => void }) {
  const [userName, setUserName] = useState<string | null>(null)
  const theme = useTheme()

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await fetch('/api/user/me')
        if (response.ok) {
          const data = await response.json()
          const profile = data.profile
          if (profile?.name) {
            setUserName(profile.name)
          } else if (profile?.email) {
            setUserName(profile.email.split('@')[0])
          }
        }
      } catch (error) {
        console.error('Failed to load user profile:', error)
      }
    }
    loadUserProfile()
  }, [])

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        zIndex: theme.zIndex.appBar
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 2, sm: 3, md: 4 } }}>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="메뉴 열기"
          onClick={onMenu}
          sx={{ mr: 2, display: 'none' }}
        >
          <Menu className="h-6 w-6" />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          {userName && (
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {userName}님
            </Typography>
          )}
          <IconButton
            component={Link}
            href="/settings"
            size="small"
            sx={{ display: { xs: 'flex', md: 'none' }, color: 'text.secondary' }}
            aria-label="설정"
          >
            <Settings size={20} />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
