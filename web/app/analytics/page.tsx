'use client'

import { useEffect, useState } from 'react'

import { Box, Container, Typography, Grid, Card, CardContent, Alert, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, useMediaQuery, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MobileDataCard from '../components/ui/MobileDataCard'
import { CardSkeleton } from '../components/ui/SkeletonLoader'
import EmptyState from '../components/ui/EmptyState'
import { TrendingUp, Users, Star, DollarSign, BarChart2, Download } from 'lucide-react'
import PageHeader, { createActionButton } from '../components/common/PageHeader'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useAppToast } from '../lib/ui/toast'
import { exportToCSV } from '../lib/utils/export'

interface CustomerLTV {
    customer_id: string
    customer_name: string
    total_revenue: number
    visit_count: number
    avg_revenue: number
    first_visit: string
    last_visit: string
    return_rate: number
}

interface VIPCustomer {
    customer_id: string
    customer_name: string
    customer_phone: string
    total_revenue: number
    transaction_count: number
    last_visit: string
}

export default function AnalyticsPage() {
    const [ltvData, setLtvData] = useState<CustomerLTV[]>([])
    const [vipData, setVipData] = useState<VIPCustomer[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const toast = useAppToast()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            setLoading(true)
            const [ltvResponse, vipResponse] = await Promise.all([
                fetch('/api/analytics/customer-ltv'),
                fetch('/api/analytics/vip-customers')
            ])

            if (!ltvResponse.ok || !vipResponse.ok) {
                throw new Error('데이터를 불러오는데 실패했습니다')
            }

            const ltv = await ltvResponse.json()
            const vip = await vipResponse.json()

            setLtvData(ltv)
            setVipData(vip)
        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
            toast.error('데이터를 불러오는데 실패했습니다')
        } finally {
            setLoading(false)
        }
    }

    const totalCustomers = ltvData.length
    const avgLTV = totalCustomers > 0
        ? ltvData.reduce((sum, c) => sum + c.total_revenue, 0) / totalCustomers
        : 0

    const chartData = ltvData
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 10)
        .map(c => ({
            name: c.customer_name,
            구매액: c.total_revenue,
            방문횟수: c.visit_count
        }))

    const handleExport = () => {
        const dataToExport = ltvData.map(item => ({
            '고객명': item.customer_name,
            '총 매출액': item.total_revenue,
            '방문 횟수': item.visit_count,
            '평균 매출액': Math.round(item.avg_revenue),
            '첫 방문일': item.first_visit ? new Date(item.first_visit).toLocaleDateString() : '-',
            '최근 방문일': item.last_visit ? new Date(item.last_visit).toLocaleDateString() : '-',
            '재방문율(%)': (item.return_rate * 100).toFixed(1)
        }))
        exportToCSV(dataToExport, `고객LTV분석_${new Date().toISOString().slice(0, 10)}.csv`)
        toast.success('분석 리포트가 다운로드되었습니다')
    }

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
                <PageHeader
                    title="고객 분석"
                    description="고객 생애 가치(LTV) 및 VIP 고객 분석"
                    icon={<TrendingUp />}
                    actions={[]}
                />
                <Box sx={{ mb: 4 }}>
                    <CardSkeleton count={3} />
                </Box>
                <CardSkeleton count={2} />
            </Container>
        )
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        )
    }

    if (ltvData.length === 0) {
        return (
            <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
                <PageHeader
                    title="고객 분석"
                    description="고객 생애 가치(LTV) 및 VIP 고객 분석"
                    icon={<TrendingUp />}
                    actions={[
                        createActionButton('새로고침', fetchData, 'secondary'),
                    ]}
                />
                <EmptyState
                    icon={BarChart2}
                    title="분석할 데이터가 없습니다"
                    description="고객 결제 내역이 쌓이면 자동으로 분석 데이터가 표시됩니다."
                    actionLabel="새로고침"
                    onAction={fetchData}
                />
            </Container>
        )
    }

    return (
        <Container maxWidth={false} sx={{ py: 4, px: { xs: 1.5, sm: 2, md: 3 }, maxWidth: { xs: '100%', md: '1200px' }, width: '100%' }}>
            <PageHeader
                title="고객 분석"
                description="고객 생애 가치(LTV) 및 VIP 고객 분석"
                icon={<TrendingUp />}
                actions={[
                    ...(isMobile ? [] : [createActionButton('CSV 내보내기', handleExport, 'secondary', <Download size={16} />)])
                ]}
            />

            {/* 요약 카드 */}
            <Grid container spacing={{ xs: 0.75, sm: 1.5, md: 2.5, lg: 3 }} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Users size={20} color="#667eea" />
                                <Typography variant="body2" color="text.secondary">
                                    총 고객 수
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight={700}>
                                {(totalCustomers || 0).toLocaleString()}명
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <DollarSign size={20} color="#10b981" />
                                <Typography variant="body2" color="text.secondary">
                                    평균 LTV
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight={700}>
                                ₩{(Math.round(avgLTV) || 0).toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Star size={20} color="#f59e0b" />
                                <Typography variant="body2" color="text.secondary">
                                    VIP 고객
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight={700}>
                                {(vipData?.length || 0).toLocaleString()}명
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* LTV 차트 */}
            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        고객별 LTV 상위 10명
                    </Typography>
                    <Box sx={{ width: '100%', height: 400, mt: 2 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis yAxisId="left" orientation="left" stroke="#667eea" />
                                <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                                <Tooltip
                                    formatter={(value: number) => (value || 0).toLocaleString()}
                                    contentStyle={{ borderRadius: 8 }}
                                />
                                <Legend />
                                <Bar yAxisId="left" dataKey="구매액" fill="#667eea" />
                                <Bar yAxisId="right" dataKey="방문횟수" fill="#10b981" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </CardContent>
            </Card>

            {/* VIP 고객 리스트 */}
            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        VIP 고객 목록
                    </Typography>
                    {isMobile ? (
                        <Stack spacing={2} sx={{ mt: 2 }}>
                            {vipData.slice(0, 10).map((customer, index) => (
                                <MobileDataCard
                                    key={customer.customer_id}
                                    title={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip label={index + 1} size="small" color={index < 3 ? 'warning' : 'default'} sx={{ height: 20, fontSize: '0.7rem' }} />
                                            <Typography variant="subtitle2" fontWeight="bold">{customer.customer_name}</Typography>
                                        </Box>
                                    }
                                    subtitle={`거래 ${customer.transaction_count}회 | ${customer.customer_phone || '-'}`}
                                    status={{ label: 'VIP', color: 'warning' }}
                                    content={
                                        <Typography variant="body2" fontWeight={700} color="success.main" textAlign="right">
                                            총 구매액: ₩{(customer.total_revenue || 0).toLocaleString()}
                                        </Typography>
                                    }
                                />
                            ))}
                        </Stack>
                    ) : (
                        <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>순위</TableCell>
                                        <TableCell>고객명</TableCell>
                                        <TableCell>연락처</TableCell>
                                        <TableCell align="right">총 구매액</TableCell>
                                        <TableCell align="right">거래 횟수</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {vipData.slice(0, 20).map((customer, index) => (
                                        <TableRow key={customer.customer_id}>
                                            <TableCell>
                                                <Chip
                                                    label={index + 1}
                                                    size="small"
                                                    color={index < 3 ? 'warning' : 'default'}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Star size={16} color="#f59e0b" fill="#f59e0b" />
                                                    {customer.customer_name}
                                                </Box>
                                            </TableCell>
                                            <TableCell>{customer.customer_phone || '-'}</TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontWeight={600} color="success.main">
                                                    ₩{(customer.total_revenue || 0).toLocaleString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">{customer.transaction_count}회</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            {/* 전체 LTV 리스트 */}
            <Card>
                <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        전체 고객 LTV
                    </Typography>
                    {isMobile ? (
                        <Stack spacing={2} sx={{ mt: 2 }}>
                            {ltvData.slice(0, 10).map((customer) => (
                                <MobileDataCard
                                    key={customer.customer_id}
                                    title={customer.customer_name}
                                    subtitle={`방문 ${customer.visit_count}회 | 재방문율 ${customer.return_rate.toFixed(1)}%`}
                                    content={
                                        <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="text.secondary">총 구매액</Typography>
                                                <Typography variant="body2" fontWeight={600}>₩{customer.total_revenue.toLocaleString()}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="text.secondary">평균 객단가</Typography>
                                                <Typography variant="body2" fontWeight={600}>₩{Math.round(customer.avg_revenue).toLocaleString()}</Typography>
                                            </Grid>
                                        </Grid>
                                    }
                                />
                            ))}
                        </Stack>
                    ) : (
                        <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>고객명</TableCell>
                                        <TableCell align="right">총 구매액</TableCell>
                                        <TableCell align="right">평균 구매액</TableCell>
                                        <TableCell align="right">방문 횟수</TableCell>
                                        <TableCell align="right">재방문율</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {ltvData.map((customer) => (
                                        <TableRow key={customer.customer_id}>
                                            <TableCell>{customer.customer_name}</TableCell>
                                            <TableCell align="right">₩{customer.total_revenue.toLocaleString()}</TableCell>
                                            <TableCell align="right">₩{Math.round(customer.avg_revenue).toLocaleString()}</TableCell>
                                            <TableCell align="right">{customer.visit_count}회</TableCell>
                                            <TableCell align="right">{customer.return_rate.toFixed(1)}%</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>
        </Container >
    )
}
