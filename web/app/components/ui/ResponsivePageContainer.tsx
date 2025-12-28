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
            maxWidth={maxWidth}
            sx={{
                py: { xs: 2, sm: 3, md: 4 },
                px: { xs: 2, sm: 3 }, // Ensure consistent horizontal padding
                minHeight: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {children}
        </Container>
    )
}
