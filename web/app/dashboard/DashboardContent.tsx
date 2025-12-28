'use client'

import { useShopName } from '../lib/hooks/useShopName'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import MetricCard from '../components/MetricCard'
import DashboardInstallPrompt from '../components/dashboard/DashboardInstallPrompt'
import Link from 'next/link'
import RecentTransactionsTable, { Transaction } from '../components/dashboard/RecentTransactionsTable'
import { Box, Grid, Typography, Stack, List, ListItem, ListItemText, Container } from '@mui/material'
import RevenueChart from '../components/dashboard/RevenueChart'
import TopServicesChart from '../components/dashboard/TopServicesChart'
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton'
import { PackageOpen, CalendarX } from 'lucide-react'

type RecentAppointment = {
    id: string
    appointment_date: string
    customer_name: string
    product_name: string
}

type ProductSummary = {
    id: string | number
    name: string
    price: number
    active?: boolean
}

interface DashboardContentProps {
    start: string
    end: string
    userId: string
    accessToken: string | undefined
    initialData: any
}

export default function DashboardContent({ initialData }: DashboardContentProps) {
    const shopName = useShopName()

    if (!initialData) {
        return <DashboardSkeleton />
    }

    const {
        todayAppointments,
        monthlyProfit,
        monthlyNewCustomers,
        monthlyAppointments,
        recentAppointments,
        chartAppointments, // New
        recentTransactions,
        monthlyRevenueData, // New
        activeProducts
    } = initialData

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Stack spacing={3}>
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ color: 'text.primary', mb: 0.5 }}>
                        {shopName}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        오늘도 힘차게 비즈니스를 관리해 보세요.
                    </Typography>
                </Box>

                <DashboardInstallPrompt />

                {/* Metrics */}
                <Grid container spacing={{ xs: 1, sm: 2.5, md: 3 }}>
                    <Grid item xs={6} sm={6} md={3}>
                        <MetricCard
                            label="오늘 예약"
                            value={todayAppointments}
                            hint="오늘 기준"
                            colorIndex={0}
                        />
                    </Grid>
                    <Grid item xs={6} sm={6} md={3}>
                        <MetricCard
                            label="월간 순이익"
                            value={`₩${Number(monthlyProfit).toLocaleString()}`}
                            hint="이번 달 기준"
                            colorIndex={1}
                        />
                    </Grid>
                    <Grid item xs={6} sm={6} md={3}>
                        <MetricCard
                            label="이번 달 신규 고객"
                            value={monthlyNewCustomers}
                            hint="이번 달 기준"
                            colorIndex={2}
                        />
                    </Grid>
                    <Grid item xs={6} sm={6} md={3}>
                        <MetricCard
                            label="이번 달 총 예약"
                            value={monthlyAppointments}
                            hint="이번 달 기준"
                            colorIndex={3}
                        />
                    </Grid>
                </Grid>

                {/* Charts Row - NEW */}
                <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }} sx={{ minHeight: 400 }}>
                    <Grid item xs={12} lg={8}>
                        {/* Revenue Chart */}
                        <RevenueChart transactions={monthlyRevenueData || recentTransactions} />
                    </Grid>
                    <Grid item xs={12} lg={4}>
                        {/* Top Services Chart */}
                        <TopServicesChart recentAppointments={chartAppointments || recentAppointments} />
                    </Grid>
                </Grid>

                {/* Main Content Areas */}
                <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }}>
                    {/* Expanded Products Section */}
                    <Grid item xs={12} lg={8}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ background: 'linear-gradient(to right, #059669, #0d9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    판매 중인 상품
                                </Typography>
                                <Link href="/products" style={{ fontSize: '0.75rem', color: '#64748B', textDecoration: 'none' }}>
                                    전체보기 →
                                </Link>
                            </Box>
                            {activeProducts.length > 0 ? (
                                <Grid container spacing={{ xs: 1, sm: 2 }}>
                                    {activeProducts.slice(0, 12).map((p: ProductSummary) => (
                                        <Grid item xs={6} sm={6} md={4} key={p.id}>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    p: 1.5,
                                                    borderRadius: 3,
                                                    bgcolor: 'background.paper',
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    '&:hover': {
                                                        bgcolor: 'rgba(16, 185, 129, 0.04)',
                                                        borderColor: 'success.light',
                                                        transform: 'translateY(-4px)',
                                                        boxShadow: '0 12px 24px -10px rgba(16, 185, 129, 0.2)'
                                                    }
                                                }}
                                            >
                                                <Typography variant="body2" fontWeight={600} noWrap sx={{ mb: 1, color: 'text.primary' }}>
                                                    {p.name}
                                                </Typography>
                                                <Typography variant="h6" fontWeight={700} color="success.main">
                                                    ₩{Number(p.price || 0).toLocaleString()}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Stack
                                    alignItems="center"
                                    justifyContent="center"
                                    spacing={2}
                                    sx={{ py: 8, bgcolor: 'background.default', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}
                                >
                                    <PackageOpen size={48} className="text-gray-300" />
                                    <Box textAlign="center">
                                        <Typography variant="body1" color="text.secondary" fontWeight={500} gutterBottom>
                                            등록된 상품이 없습니다
                                        </Typography>
                                        <Link href="/products" style={{ color: '#3B82F6', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                                            + 상품 추가하기
                                        </Link>
                                    </Box>
                                </Stack>
                            )}
                        </Card>
                    </Grid>

                    {/* Recent Appointments */}
                    <Grid item xs={12} lg={4}>
                        <Card sx={{ height: '100%' }}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', pb: 2.5, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ background: 'linear-gradient(to right, #db2777, #e11d48)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    최근 예약
                                </Typography>
                                <Link href="/appointments" style={{ fontSize: '0.75rem', color: '#64748B', textDecoration: 'none' }}>
                                    전체보기 →
                                </Link>
                            </Box>
                            <List disablePadding>
                                {recentAppointments.length > 0 ? recentAppointments.slice(0, 8).map((a: RecentAppointment) => {
                                    const isToday = new Date(a.appointment_date).toDateString() === new Date().toDateString()
                                    return (
                                        <ListItem
                                            key={a.id}
                                            disableGutters
                                            sx={{
                                                py: 1.75,
                                                px: 1,
                                                borderBottom: '1px solid',
                                                borderLeft: isToday ? '3px solid' : 'none',
                                                borderColor: isToday ? 'primary.main' : 'divider',
                                                bgcolor: isToday ? 'primary.50' : 'transparent',
                                                '&:last-child': { borderBottom: 'none' }
                                            }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <Typography variant="body2" fontWeight={600}>{a.customer_name}</Typography>
                                                        <Typography variant="caption" color="primary.main">{a.product_name}</Typography>
                                                    </Box>
                                                }
                                                secondary={String(a.appointment_date).slice(0, 16).replace('T', ' ')}
                                                secondaryTypographyProps={{ variant: 'caption', sx: { mt: 0.5, display: 'block' } }}
                                            />
                                        </ListItem>
                                    )
                                }) : (
                                    <Stack
                                        alignItems="center"
                                        justifyContent="center"
                                        spacing={2}
                                        sx={{ py: 6 }}
                                    >
                                        <CalendarX size={48} className="text-gray-300" />
                                        <Box textAlign="center">
                                            <Typography variant="body1" fontWeight={600} color="text.secondary" gutterBottom>
                                                최근 예약 내역이 없습니다
                                            </Typography>
                                            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 2 }}>
                                                새 예약을 추가하여 시작하세요
                                            </Typography>
                                            <Link href="/appointments" passHref>
                                                <Button variant="primary" size="sm">
                                                    예약 추가
                                                </Button>
                                            </Link>
                                        </Box>
                                    </Stack>
                                )}
                            </List>
                        </Card>
                    </Grid>

                    {/* Full-width Recent Transactions Table */}
                    <Grid item xs={12}>
                        <Card>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', pb: 2.5, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ background: 'linear-gradient(to right, #2563eb, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    최근 거래 내역
                                </Typography>
                                <Link href="/finance" style={{ fontSize: '0.75rem', color: '#64748B', textDecoration: 'none' }}>
                                    전체보기 →
                                </Link>
                            </Box>
                            <RecentTransactionsTable transactions={recentTransactions.slice(0, 10) as Transaction[]} />
                        </Card>
                    </Grid>
                </Grid>
            </Stack>
        </Container>
    )
}
