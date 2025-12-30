'use client'

import { Grid, Card, CardContent, Typography, Box } from '@mui/material'
import { DollarSign, FileText, Users, Calculator } from 'lucide-react'

interface PayrollSummaryCardsProps {
    totalStaffCount: number
    filteredStaffCount: number
    totalGrossPay: number
    totalNetPay: number
    calculatedRecordsCount: number
    filteredStaffLength: number
}

export default function PayrollSummaryCards({
    totalStaffCount,
    filteredStaffCount,
    totalGrossPay,
    totalNetPay,
    calculatedRecordsCount,
    filteredStaffLength
}: PayrollSummaryCardsProps) {
    return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Users size={20} className="text-indigo-500" />
                            <Typography variant="body2" color="text.secondary">
                                급여 대상 직원
                            </Typography>
                        </Box>
                        <Typography variant="h4" fontWeight={700}>
                            {filteredStaffCount}명
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            전체 {totalStaffCount}명 중
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <DollarSign size={20} className="text-emerald-500" />
                            <Typography variant="body2" color="text.secondary">
                                총 지급액 (세전)
                            </Typography>
                        </Box>
                        <Typography variant="h4" fontWeight={700} color="success.main">
                            ₩{totalGrossPay.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            평균 ₩{filteredStaffLength > 0 ? Math.round(totalGrossPay / filteredStaffLength).toLocaleString() : 0}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <FileText size={20} className="text-indigo-500" />
                            <Typography variant="body2" color="text.secondary">
                                실지급액 (세후)
                            </Typography>
                        </Box>
                        <Typography variant="h4" fontWeight={700}>
                            ₩{totalNetPay.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            공제액 ₩{(totalGrossPay - totalNetPay).toLocaleString()}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Calculator size={20} className="text-orange-500" />
                            <Typography variant="body2" color="text.secondary">
                                계산 상태
                            </Typography>
                        </Box>
                        <Typography variant="h4" fontWeight={700}>
                            {calculatedRecordsCount}/{filteredStaffLength}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {Math.round((calculatedRecordsCount / Math.max(filteredStaffLength, 1)) * 100)}% 완료
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    )
}
