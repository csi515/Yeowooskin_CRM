'use client'

import { Card, CardContent, Typography, Grid, Box } from '@mui/material'
import { type PayrollRecord } from '@/types/payroll'

interface PayrollStatusSummaryProps {
    records: PayrollRecord[]
    filteredStaffLength: number
}

export default function PayrollStatusSummary({ records, filteredStaffLength }: PayrollStatusSummaryProps) {
    if (records.length === 0) return null

    const statusCounts = [
        { label: '미계산', count: filteredStaffLength - records.length, color: 'default' },
        { label: '계산완료', count: records.filter(r => r.status === 'calculated').length, color: 'warning' },
        { label: '승인완료', count: records.filter(r => r.status === 'approved').length, color: 'info' },
        { label: '지급완료', count: records.filter(r => r.status === 'paid').length, color: 'success' },
    ]

    return (
        <Card sx={{ mb: 4 }}>
            <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                    급여 처리 현황
                </Typography>
                <Grid container spacing={2}>
                    {statusCounts.map((status) => (
                        <Grid item xs={6} sm={3} key={status.label}>
                            <Box sx={{
                                textAlign: 'center',
                                p: 2,
                                borderRadius: 2,
                                bgcolor: `${status.color}.light`,
                                border: `1px solid`,
                                borderColor: `${status.color}.main`
                            }}>
                                <Typography variant="h4" fontWeight={700} color={`${status.color}.dark`}>
                                    {status.count}
                                </Typography>
                                <Typography variant="body2" color={`${status.color}.dark`}>
                                    {status.label}
                                </Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    )
}
