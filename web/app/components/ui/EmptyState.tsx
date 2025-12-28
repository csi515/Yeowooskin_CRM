import { Box, Typography, Button } from '@mui/material'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
    icon?: LucideIcon
    title: string
    description?: string
    actionLabel?: string
    onAction?: () => void
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            textAlign: 'center',
            color: 'text.secondary',
            minHeight: 200,
            width: '100%',
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'divider'
        }}>
            {Icon && <Icon size={48} style={{ marginBottom: 16, opacity: 0.5 }} />}
            <Typography variant="h6" gutterBottom color="text.primary">
                {title}
            </Typography>
            {description && (
                <Typography variant="body2" mb={3} maxWidth={400}>
                    {description}
                </Typography>
            )}
            {actionLabel && onAction && (
                <Button variant="contained" onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </Box>
    )
}
