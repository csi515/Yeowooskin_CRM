'use client'

import MuiDrawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import { X } from 'lucide-react'
import { ReactNode } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  children: ReactNode
  placement?: 'left' | 'right' | 'top' | 'bottom'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
  closeOnOverlayClick?: boolean
}

export default function Drawer({
  open,
  onClose,
  children,
  placement = 'right',
  size = 'md',
  className = '',
}: Props) {
  const sizeMap = {
    sm: 320,
    md: 400,
    lg: 560,
    xl: 720,
    full: '100%',
  }

  const isVertical = placement === 'left' || placement === 'right'

  return (
    <MuiDrawer
      anchor={placement}
      open={open}
      onClose={onClose}
      variant="temporary"
      className={className}
      PaperProps={{
        sx: {
          width: isVertical ? sizeMap[size] : '100%',
          height: isVertical ? '100%' : sizeMap[size],
          maxWidth: '100%',
          maxHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }
      }}
      slotProps={{
        backdrop: {
          sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(15, 23, 42, 0.5)' }
        }
      }}
    >
      <Box sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <IconButton
          onClick={onClose}
          aria-label="닫기"
          sx={{
            position: 'absolute',
            right: 12,
            top: 12,
            color: 'text.secondary',
            zIndex: 10,
            '&:hover': { bgcolor: 'action.hover' }
          }}
          size="small"
        >
          <X size={20} />
        </IconButton>
        {children}
      </Box>
    </MuiDrawer>
  )
}

export function DrawerHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Box
      className={className}
      sx={{
        px: 3,
        py: 2.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        pr: 6 // For close button space
      }}
    >
      {children}
    </Box>
  )
}

export function DrawerBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Box
      className={className}
      sx={{
        px: 3,
        py: 3,
        overflowY: 'auto',
        flex: 1
      }}
    >
      {children}
    </Box>
  )
}

export function DrawerFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Box
      className={className}
      sx={{
        px: 3,
        py: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.default', // Slight background to define footer
      }}
    >
      {children}
    </Box>
  )
}
