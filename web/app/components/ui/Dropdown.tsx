'use client'

import React, { useState, ReactNode } from 'react'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import { ChevronDown } from 'lucide-react'
import Button from './Button' // Our custom MUI wrapper

type DropdownItem = {
  label: string
  value?: string | number
  onClick?: () => void
  disabled?: boolean
  divider?: boolean
  icon?: ReactNode
}

type Props = {
  trigger: ReactNode | string
  items: DropdownItem[]
  onSelect?: (item: DropdownItem) => void
  placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' // MUI Menu uses anchorOrigin/transformOrigin
  className?: string
  disabled?: boolean
}

export default function Dropdown({
  trigger,
  items,
  onSelect,
  className = '',
  disabled = false,
}: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (disabled) return
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return
    item.onClick?.()
    onSelect?.(item)
    handleClose()
  }

  // Helper to map placement string to MUI anchor/transform structure if needed.
  // Standard drop-down is usually bottom-start.

  const triggerContent =
    typeof trigger === 'string' ? (
      <Button
        variant="secondary"
        rightIcon={<ChevronDown size={16} />}
        onClick={handleClick}
        disabled={disabled}
        className={className}
      >
        {trigger}
      </Button>
    ) : (
      // If trigger is a node, we wrap it or clone it to add onClick. 
      // But wrapping in Box or div is safer.
      <Box
        onClick={handleClick}
        sx={{ display: 'inline-block', cursor: disabled ? 'default' : 'pointer' }}
        className={className}
      >
        {trigger}
      </Box>
    )

  return (
    <>
      {triggerContent}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        slotProps={{
          paper: {
            elevation: 2,
            sx: { mt: 1, minWidth: 160, borderRadius: 2 }
          }
        }}
      >
        {items.map((item, index) => {
          if (item.divider) {
            return <Divider key={index} />
          }
          return (
            <MenuItem
              key={index}
              onClick={() => handleItemClick(item)}
              disabled={!!item.disabled}
            >
              {item.icon && (
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
              )}
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}
