'use client'

import { useEffect, useState } from 'react'
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Alert,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from '@mui/material'
import { CardSkeleton } from '../components/ui/SkeletonLoader'
import EmptyState from '../components/ui/EmptyState'
import { TrendingUp, Users, Star, DollarSign, BarChart2 } from 'lucide-react'
import PageHeader, { createActionButton } from '../components/common/PageHeader'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useAppToast } from '../lib/ui/toast'

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

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
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
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        )
    }

    if (ltvData.length === 0) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
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
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <PageHeader
                title="고객 분석"
                description="고객 생애 가치(LTV) 및 VIP 고객 분석"
                icon={<TrendingUp />}
                actions={[
                    createActionButton('새로고침', fetchData, 'secondary'),
                ]}
            />

            {/* 요약 카드 */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
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
                                {totalCustomers.toLocaleString()}명
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
                                ₩{Math.round(avgLTV).toLocaleString()}
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
                                {vipData.length.toLocaleString()}명
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
                                    formatter={(value: number) => value.toLocaleString()}
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
                                                ₩{customer.total_revenue.toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">{customer.transaction_count}회</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* 전체 LTV 리스트 */}
            <Card>
                <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        전체 고객 LTV
                    </Typography>
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
                </CardContent>
            </Card>
        </Container>
    )
}
