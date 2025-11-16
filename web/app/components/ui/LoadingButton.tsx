'use client'

import Button from './Button'
import Spinner from './Spinner'
import type { ReactNode } from 'react'

type Props = React.ComponentProps<typeof Button> & {
  loading?: boolean
  loadingText?: string
  loadingIcon?: ReactNode
}

export default function LoadingButton({
  loading = false,
  loadingText,
  loadingIcon,
  disabled,
  children,
  leftIcon,
  ...rest
}: Props) {
  const displayLeftIcon = loading ? (loadingIcon || <Spinner size="sm" />) : leftIcon
  const displayText = loading && loadingText ? loadingText : children

  return (
    <Button
      {...rest}
      disabled={disabled || loading}
      leftIcon={displayLeftIcon}
    >
      {displayText}
    </Button>
  )
}
