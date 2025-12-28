import React from 'react'
import { Box, Card, Typography, Divider, Chip, Stack } from '@mui/material'
import { ChevronRight } from 'lucide-react'

export interface MobileDataCardProps {
    title: React.ReactNode
    subtitle?: React.ReactNode
    status?: {
        label: string
        color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
    }
    content?: React.ReactNode
    onClick?: () => void
    action?: React.ReactNode
}

export default function MobileDataCard({
    title,
    subtitle,
    status,
    content,
    onClick,
    action
}: MobileDataCardProps) {
    return (
        <Card
            elevation={0}
            sx={{
                p: 2,
                mb: 2,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                cursor: onClick ? 'pointer' : 'default',
                '&:active': onClick ? { bgcolor: 'action.hover' } : {}
            }}
            onClick={onClick}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600} noWrap>
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="body2" color="text.secondary" noWrap>
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                {status && (
                    <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                        sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600 }}
                    />
                )}
            </Box>

            {content && (
                <Box sx={{ mt: 1.5 }}>
                    {content}
                </Box>
            )}

            {(action || onClick) && (
                <>
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {action}
                        {onClick && !action && (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <Typography variant="caption" color="primary.main" fontWeight={600}>
                                    상세보기
                                </Typography>
                                <ChevronRight size={16} className="text-blue-600" />
                            </Stack>
                        )}
                    </Box>
                </>
            )}
        </Card>
    )
}
