'use client'

import { useState, useEffect } from 'react'
import Alert from './Alert'
import { useLocalStorage } from '@/app/lib/hooks/useLocalStorage'
import clsx from 'clsx'

type Props = {
  id: string
  variant?: 'success' | 'warning' | 'error' | 'info'
  title?: string
  children?: React.ReactNode
  description?: string
  dismissible?: boolean
  showOncePerDay?: boolean
  className?: string
}

export default function AnnouncementBanner({
  id,
  variant = 'info',
  title,
  children,
  description,
  dismissible = true,
  showOncePerDay = true,
  className,
}: Props) {
  const [isVisible, setIsVisible] = useState(false)
  const [lastDismissed, setLastDismissed] = useLocalStorage<number | null>(
    `announcement-${id}-dismissed`,
    null
  )

  useEffect(() => {
    if (!showOncePerDay) {
      setIsVisible(true)
      return
    }

    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000

    // If never dismissed or dismissed more than a day ago, show the banner
    if (!lastDismissed || now - lastDismissed > oneDay) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [lastDismissed, showOncePerDay])

  const handleDismiss = () => {
    setIsVisible(false)
    if (showOncePerDay) {
      setLastDismissed(Date.now())
    }
  }

  if (!isVisible) return null

  return (
    <div className={clsx('mb-4', className)}>
      <Alert
        variant={variant}
        title={title}
        description={description}
        dismissible={dismissible}
        onDismiss={handleDismiss}
      >
        {children}
      </Alert>
    </div>
  )
}
