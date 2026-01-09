'use client'

import { useMemo, useEffect, useState } from 'react'
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
import ErrorState from '../components/common/ErrorState'
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
    error?: string | Error | null
}

export default function DashboardContent({ initialData, error }: DashboardContentProps) {
    const shopName = useShopName()
    const [scrollProgress, setScrollProgress] = useState(0)

    // 스크롤 진행률 계산 (모바일 전용)
    useEffect(() => {
        const handleScroll = () => {
            const windowHeight = window.innerHeight
            const documentHeight = document.documentElement.scrollHeight
            const scrollTop = window.scrollY || document.documentElement.scrollTop
            const scrollableHeight = documentHeight - windowHeight
            const progress = scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 0
            setScrollProgress(Math.min(100, Math.max(0, progress)))
        }

        // 모바일에서만 스크롤 인디케이터 활성화
        if (window.innerWidth < 768) {
            window.addEventListener('scroll', handleScroll, { passive: true })
            handleScroll() // 초기값 설정
        }

        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])

    const data = initialData ?? {}
    const activeProducts = data.activeProducts ?? []
    const recentAppointments = data.recentAppointments ?? []
    const recentTransactions = data.recentTransactions ?? []
    const monthlyProfit = data.monthlyProfit ?? 0

    // 성능 최적화: 계산된 값 메모이제이션 (hooks는 항상 동일 순서로 호출)
    const slicedProducts = useMemo(() => activeProducts.slice(0, 12), [activeProducts])
    const slicedAppointments = useMemo(() => recentAppointments.slice(0, 8), [recentAppointments])
    const slicedTransactions = useMemo(() => recentTransactions.slice(0, 10), [recentTransactions])
    const formattedMonthlyProfit = useMemo(
        () => `₩${Number(monthlyProfit || 0).toLocaleString()}`,
        [monthlyProfit]
    )

    if (error) {
        const errorMessage = error instanceof Error ? error.message : (typeof error === 'string' ? error : '데이터를 불러오는 중 오류가 발생했습니다.')
        return (
            <Container 
                maxWidth={false}
                sx={{ 
                    py: { xs: 2, sm: 3, md: 4 }, 
                    px: { xs: 1.5, sm: 2, md: 3 },
                    width: '100%',
                    maxWidth: { xs: '100%', md: '1200px' },
                }}
            >
                <ErrorState
                    title="대시보드 데이터를 불러올 수 없습니다"
                    message={errorMessage}
                    onRetry={() => window.location.reload()}
                    retryLabel="새로고침"
                />
            </Container>
        )
    }

    if (!initialData) {
        return <DashboardSkeleton />
    }

    const {
        todayAppointments,
        // monthlyProfit은 위에서 기본값 처리 및 memo에 사용
        monthlyNewCustomers,
        monthlyAppointments,
        chartAppointments, // New
        monthlyRevenueData, // New
        // activeProducts/recentAppointments/recentTransactions는 위에서 기본값 처리 및 memo에 사용
    } = initialData

    return (
        <>
            {/* 스크롤 인디케이터 (모바일 전용) */}
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    bgcolor: 'divider',
                    zIndex: 1100,
                    display: { xs: 'block', md: 'none' },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${scrollProgress}%`,
                        bgcolor: 'primary.main',
                        transition: 'width 0.1s ease-out',
                    },
                }}
            />
            <Container 
                maxWidth={false}
                sx={{ 
                    py: { xs: 2, sm: 3, md: 4 }, 
                    px: { xs: 1.5, sm: 2, md: 3 },
                    width: '100%',
                    maxWidth: { xs: '100%', md: '1200px' },
                    overflowX: 'hidden',
                    position: 'relative'
                }}
            >
            <Stack spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ width: '100%', overflowX: 'hidden' }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ color: 'text.primary', mb: 0.5, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                        {shopName}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '1rem', sm: '1rem' } }}>
                        오늘도 힘차게 비즈니스를 관리해 보세요.
                    </Typography>
                </Box>

                <DashboardInstallPrompt />

                {/* Metrics */}
                <Grid container spacing={{ xs: 0.75, sm: 1.5, md: 2.5, lg: 3 }} sx={{ width: '100%', margin: 0 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard
                            label="오늘 예약"
                            value={todayAppointments}
                            hint="오늘 기준"
                            colorIndex={0}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard
                            label="월간 순이익"
                            value={formattedMonthlyProfit}
                            hint="이번 달 기준"
                            colorIndex={1}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard
                            label="이번 달 신규 고객"
                            value={monthlyNewCustomers}
                            hint="이번 달 기준"
                            colorIndex={2}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard
                            label="이번 달 총 예약"
                            value={monthlyAppointments}
                            hint="이번 달 기준"
                            colorIndex={3}
                        />
                    </Grid>
                </Grid>

                {/* Charts Row - NEW */}
                <Grid container spacing={{ xs: 0.75, sm: 1.5, md: 2.5, lg: 3 }} sx={{ minHeight: { xs: 'auto', md: 400 }, width: '100%', margin: 0, overflowX: 'hidden' }}>
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
                <Grid container spacing={{ xs: 0.75, sm: 1.5, md: 2.5, lg: 3 }} sx={{ width: '100%', margin: 0, overflowX: 'hidden' }}>
                    {/* Expanded Products Section */}
                    <Grid item xs={12} lg={8}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: { xs: 1, sm: 0 } }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ background: 'linear-gradient(to right, #059669, #0d9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    판매 중인 상품
                                </Typography>
                                <Box
                                    component={Link}
                                    href="/products"
                                    aria-label="판매 중인 상품 전체보기"
                                    sx={{
                                        fontSize: { xs: '0.875rem', sm: '0.875rem' },
                                        color: '#64748B',
                                        textDecoration: 'none',
                                        minHeight: '44px',
                                        minWidth: '44px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: { xs: '0.75rem', sm: '0.5rem' }
                                    }}
                                >
                                    전체보기 →
                                </Box>
                            </Box>
                            {activeProducts.length > 0 ? (
                                <Grid container spacing={{ xs: 0.75, sm: 1.5, md: 2 }}>
                                    {slicedProducts.map((p: ProductSummary, index: number) => (
                                        <Grid item xs={12} sm={6} md={4} key={p.id}>
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
                                                    width: '100%',
                                                    maxWidth: '100%',
                                                    overflow: 'hidden',
                                                    touchAction: 'manipulation',
                                                    WebkitTapHighlightColor: 'transparent',
                                                    animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`,
                                                    '@keyframes fadeInUp': {
                                                        from: {
                                                            opacity: 0,
                                                            transform: 'translateY(10px)',
                                                        },
                                                        to: {
                                                            opacity: 1,
                                                            transform: 'translateY(0)',
                                                        },
                                                    },
                                                    '&:hover': {
                                                        bgcolor: 'rgba(16, 185, 129, 0.04)',
                                                        borderColor: 'success.light',
                                                        transform: { xs: 'none', md: 'translateY(-4px)' },
                                                        boxShadow: { xs: 'none', md: '0 12px 24px -10px rgba(16, 185, 129, 0.2)' }
                                                    },
                                                    '&:active': {
                                                        transform: { xs: 'scale(0.98)', md: 'none' },
                                                        bgcolor: 'rgba(16, 185, 129, 0.08)',
                                                    }
                                                }}
                                            >
                                                <Typography variant="body2" fontWeight={600} sx={{ mb: 1, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: { xs: 2, sm: 1 }, WebkitBoxOrient: 'vertical', fontSize: { xs: '1rem', sm: '0.875rem' } }}>
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
                                    <PackageOpen 
                                        size={48} 
                                        className="text-gray-300"
                                        style={{ 
                                            width: 'clamp(40px, 12vw, 48px)',
                                            height: 'clamp(40px, 12vw, 48px)'
                                        }}
                                    />
                                    <Box textAlign="center">
                                        <Typography variant="body1" color="text.secondary" fontWeight={500} gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1rem' } }}>
                                            아직 등록된 상품이 없어요
                                        </Typography>
                                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1, mb: 2, fontSize: { xs: '0.875rem', sm: '0.75rem' } }}>
                                            첫 상품을 등록하고 비즈니스를 시작해보세요!
                                        </Typography>
                                        <Link 
                                            href="/products" 
                                            aria-label="상품 추가하기"
                                            style={{ 
                                                color: '#3B82F6', 
                                                fontSize: '0.875rem', 
                                                fontWeight: 600, 
                                                textDecoration: 'none',
                                                minHeight: '44px',
                                                minWidth: '44px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '0.75rem 1rem'
                                            }}
                                        >
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
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', pb: 2.5, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: { xs: 1, sm: 0 } }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ background: 'linear-gradient(to right, #db2777, #e11d48)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    최근 예약
                                </Typography>
                                <Box
                                    component={Link}
                                    href="/appointments"
                                    aria-label="최근 예약 전체보기"
                                    sx={{
                                        fontSize: { xs: '0.875rem', sm: '0.875rem' },
                                        color: '#64748B',
                                        textDecoration: 'none',
                                        minHeight: '44px',
                                        minWidth: '44px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: { xs: '0.75rem', sm: '0.5rem' }
                                    }}
                                >
                                    전체보기 →
                                </Box>
                            </Box>
                            <List disablePadding sx={{ width: '100%', overflowX: 'hidden' }}>
                                {slicedAppointments.length > 0 ? slicedAppointments.map((a: RecentAppointment, index: number) => {
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
                                                width: '100%',
                                                maxWidth: '100%',
                                                overflowX: 'hidden',
                                                minHeight: { xs: '44px', sm: 'auto' },
                                                touchAction: 'manipulation',
                                                WebkitTapHighlightColor: 'transparent',
                                                transition: 'background-color 0.15s ease',
                                                animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`,
                                                '@keyframes fadeInUp': {
                                                    from: {
                                                        opacity: 0,
                                                        transform: 'translateY(10px)',
                                                    },
                                                    to: {
                                                        opacity: 1,
                                                        transform: 'translateY(0)',
                                                    },
                                                },
                                                '&:active': {
                                                    bgcolor: { xs: 'rgba(66, 99, 235, 0.1)', sm: 'transparent' },
                                                },
                                                '&:last-child': { borderBottom: 'none' }
                                            }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: { xs: 0.5, sm: 0 } }}>
                                                        <Typography variant="body2" fontWeight={600} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: { xs: 'normal', sm: 'nowrap' }, fontSize: { xs: '1rem', sm: '0.875rem' } }}>{a.customer_name}</Typography>
                                                        <Typography variant="caption" color="primary.main" sx={{ flexShrink: 0, fontSize: { xs: '0.875rem', sm: '0.75rem' } }}>{a.product_name}</Typography>
                                                    </Box>
                                                }
                                                secondary={String(a.appointment_date).slice(0, 16).replace('T', ' ')}
                                                secondaryTypographyProps={{ variant: 'caption', sx: { mt: 0.5, display: 'block', fontSize: { xs: '0.875rem', sm: '0.75rem' } } }}
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
                                        <CalendarX 
                                            size={48} 
                                            className="text-gray-300"
                                            style={{ 
                                                width: 'clamp(40px, 12vw, 48px)',
                                                height: 'clamp(40px, 12vw, 48px)'
                                            }}
                                        />
                                        <Box textAlign="center">
                                            <Typography variant="body1" fontWeight={600} color="text.secondary" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1rem' } }}>
                                                아직 예약 내역이 없어요
                                            </Typography>
                                            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1, mb: 2, fontSize: { xs: '0.875rem', sm: '0.75rem' } }}>
                                                첫 예약을 추가하고 고객 관리를 시작해보세요!
                                            </Typography>
                                            <Link href="/appointments" passHref aria-label="예약 추가하기">
                                                <Button variant="primary" size="sm" aria-label="예약 추가하기">
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
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', pb: 2.5, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: { xs: 1, sm: 0 } }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ background: 'linear-gradient(to right, #2563eb, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    최근 거래 내역
                                </Typography>
                                <Box
                                    component={Link}
                                    href="/finance"
                                    aria-label="최근 거래 내역 전체보기"
                                    sx={{
                                        fontSize: { xs: '0.875rem', sm: '0.875rem' },
                                        color: '#64748B',
                                        textDecoration: 'none',
                                        minHeight: '44px',
                                        minWidth: '44px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: { xs: '0.75rem', sm: '0.5rem' }
                                    }}
                                >
                                    전체보기 →
                                </Box>
                            </Box>
                            <RecentTransactionsTable transactions={slicedTransactions as Transaction[]} />
                        </Card>
                    </Grid>
                </Grid>
            </Stack>
        </Container>
        </>
    )
}
