'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Box, CircularProgress, Typography } from '@mui/material'
import { ChevronDown } from 'lucide-react'

type Props = {
    children: React.ReactNode
    onRefresh?: () => Promise<void>
    disabled?: boolean
}

export default function PullToRefresh({ children, onRefresh, disabled = false }: Props) {
    const router = useRouter()
    const [startY, setStartY] = useState(0)
    const [currentY, setCurrentY] = useState(0)
    const [refreshing, setRefreshing] = useState(false)
    const [pulling, setPulling] = useState(false)
    const contentRef = useRef<HTMLDivElement>(null)

    // Threshold to trigger refresh (px)
    const PULL_THRESHOLD = 80
    // Max pull distance visually
    const MAX_PULL = 120

    useEffect(() => {
        if (refreshing) return

        const handleTouchStart = (e: TouchEvent) => {
            if (window.scrollY === 0 && !disabled && e.touches[0]) {
                setStartY(e.touches[0].clientY)
                setPulling(true)
            }
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (!pulling || disabled) return

            const y = e.touches[0]?.clientY ?? 0
            const diff = y - startY

            // Pulling down at top
            if (diff > 0 && window.scrollY === 0) {
                // Add resistance
                const newY = Math.min(diff * 0.5, MAX_PULL)
                setCurrentY(newY)

                // Prevent default only if we are significantly pulling
                // to avoid interfering with small scrolls
                if (diff > 10 && e.cancelable) {
                    e.preventDefault()
                }
            } else {
                // Scrolled down or pushing up
                setPulling(false)
                setCurrentY(0)
            }
        }

        const handleTouchEnd = async () => {
            if (!pulling || disabled) return

            if (currentY >= PULL_THRESHOLD) {
                setRefreshing(true)
                setCurrentY(PULL_THRESHOLD) // Snap to threshold

                try {
                    if (onRefresh) {
                        await onRefresh()
                    } else {
                        // Default: Router refresh
                        const start = Date.now()
                        router.refresh()
                        // Ensure minimum spin time
                        const elapsed = Date.now() - start
                        if (elapsed < 500) await new Promise(r => setTimeout(r, 500 - elapsed))
                    }
                } finally {
                    setRefreshing(false)
                    setCurrentY(0)
                }
            } else {
                setCurrentY(0)
            }
            setPulling(false)
        }

        document.addEventListener('touchstart', handleTouchStart, { passive: true })
        document.addEventListener('touchmove', handleTouchMove, { passive: false })
        document.addEventListener('touchend', handleTouchEnd)

        return () => {
            document.removeEventListener('touchstart', handleTouchStart)
            document.removeEventListener('touchmove', handleTouchMove)
            document.removeEventListener('touchend', handleTouchEnd)
        }
    }, [startY, pulling, refreshing, currentY, router, onRefresh, disabled])

    return (
        <Box>
            {/* Loading Indicator */}
            <Box
                sx={{
                    height: currentY,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: pulling ? 'none' : 'height 0.3s ease-out',
                    bgcolor: 'background.default'
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, opacity: Math.min(currentY / PULL_THRESHOLD, 1) }}>
                    {refreshing ? (
                        <CircularProgress size={24} thickness={4} />
                    ) : (
                        <>
                            <ChevronDown
                                size={24}
                                className={`text-neutral-500 transition-transform ${currentY >= PULL_THRESHOLD ? 'rotate-180' : ''}`}
                            />
                            <Typography variant="caption" color="text.secondary">
                                {currentY >= PULL_THRESHOLD ? '놓아서 새로고침' : '당겨서 새로고침'}
                            </Typography>
                        </>
                    )}
                </Box>
            </Box>

            {/* Content */}
            <Box
                ref={contentRef}
                sx={{
                    transition: pulling ? 'none' : 'transform 0.3s ease-out',
                }}
            >
                {children}
            </Box>
        </Box>
    )
}
