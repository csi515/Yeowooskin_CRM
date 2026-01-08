'use client'

import React from 'react'
import { Container } from '@mui/material'

interface ResponsivePageContainerProps {
    children: React.ReactNode
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false
}

export default function ResponsivePageContainer({
    children,
    maxWidth = 'lg'
}: ResponsivePageContainerProps) {
    return (
        <Container
            maxWidth={maxWidth === 'lg' ? false : maxWidth}
            sx={{
                py: { xs: 2, sm: 3, md: 4 },
                px: { xs: 1.5, sm: 2, md: 3 },
                minHeight: '100%',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                maxWidth: maxWidth === 'lg' ? { xs: '100%', md: '1200px' } : undefined
            }}
        >
            {children}
        </Container>
    )
}
