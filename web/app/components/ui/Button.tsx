'use client'

import { forwardRef } from 'react'
import MuiButton from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import type { ButtonProps as MuiButtonProps } from '@mui/material/Button'
import type { ReactNode } from 'react'

type Props = Omit<MuiButtonProps, 'variant' | 'color' | 'size'> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'contrast'
  size?: 'sm' | 'md' | 'lg'
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  loading?: boolean
  sx?: MuiButtonProps['sx']
}

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  {
    variant = 'primary',
    size = 'md',
    leftIcon,
    rightIcon,
    disabled,
    loading = false,
    children,
    sx,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading

  // variant를 MUI props로 매핑
  const getMuiProps = (): { variant: MuiButtonProps['variant']; color: MuiButtonProps['color'] } => {
    switch (variant) {
      case 'primary':
        return { variant: 'contained', color: 'primary' }
      case 'secondary':
        return { variant: 'contained', color: 'secondary' }
      case 'danger':
        return { variant: 'contained', color: 'error' }
      case 'outline':
        return { variant: 'outlined', color: 'primary' }
      case 'ghost':
        return { variant: 'text', color: 'primary' }
      case 'contrast':
        return { variant: 'outlined', color: 'inherit' }
      default:
        return { variant: 'contained', color: 'primary' }
    }
  }

  // size를 MUI size로 매핑
  const getMuiSize = (): MuiButtonProps['size'] => {
    switch (size) {
      case 'sm':
        return 'small'
      case 'md':
        return 'medium'
      case 'lg':
        return 'large'
      default:
        return 'medium'
    }
  }

  const muiProps = getMuiProps()
  const muiSize = getMuiSize()

  return (
    <MuiButton
      ref={ref as any}
      variant={muiProps.variant as any}
      color={muiProps.color as any}
      size={muiSize as any}
      disabled={isDisabled}
      sx={sx || {}}
      {...rest}
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : leftIcon}
      endIcon={rightIcon}
    >
      {children}
    </MuiButton>
  )
})

export default Button
