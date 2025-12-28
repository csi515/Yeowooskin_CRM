import { Skeleton, Box, Grid, Card, CardContent } from '@mui/material'

export function ListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <Box sx={{ width: '100%' }}>
            {Array.from({ length: count }).map((_, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                    <Box sx={{ width: '100%' }}>
                        <Skeleton width="40%" height={24} />
                        <Skeleton width="80%" height={20} />
                    </Box>
                </Box>
            ))}
        </Box>
    )
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
    return (
        <Grid container spacing={2}>
            {Array.from({ length: count }).map((_, i) => (
                <Grid item xs={12} md={4} key={i}>
                    <Card>
                        <CardContent>
                            <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
                            <Skeleton variant="rectangular" height={100} />
                            <Skeleton variant="text" width="40%" sx={{ mt: 1 }} />
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    )
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number, cols?: number }) {
    return (
        <Box sx={{ width: '100%' }}>
            <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
            {Array.from({ length: rows }).map((_, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <Skeleton key={j} variant="rectangular" height={30} width={`${100 / cols}%`} />
                    ))}
                </Box>
            ))}
        </Box>
    )
}
