import { Metadata } from 'next'
import { Box, Container, Typography, Grid, Card, CardContent, Stack, Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import { Calendar, Users, DollarSign, Package, CheckCircle, BarChart, Bell, Shield, Smartphone, Cloud, Zap, ChevronDown } from 'lucide-react'

export const metadata: Metadata = {
    title: '기능 소개 - BeautyHub',
    description: 'BeautyHub의 강력한 기능들을 자세히 알아보세요. 예약 관리, 고객 관리, 재무 분석, 제품 관리 등 피부관리샵 운영에 필요한 모든 기능을 제공합니다.',
    keywords: '예약 관리, 고객 관리, 재무 관리, CRM 기능, 피부관리샵 솔루션',
}

const mainFeatures = [
    {
        icon: Calendar,
        title: '정밀한 예약 프로토콜',
        description: '단순 기록을 넘어 노쇼를 방지하고 운영 효율을 극대화하는 예약 시스템입니다.',
        details: [
            '예약 직후 - 전일 - 당일로 이어지는 단계별 자동 리마인더',
            '드래그 앤 드롭으로 간편한 예약 시간 상호 조정',
            '시술별 소요 시간 자동 계산으로 중복 예약 방지',
            '전용 모바일 대시보드로 이동 중에도 일정 즉시 확인',
        ]
    },
    {
        icon: Users,
        title: '데이터 기반 고객 케어',
        description: '파편화된 고객 정보를 통합하여 맞춤형 프리미엄 서비스를 실현합니다.',
        details: [
            '상담 일지, 피부 타입, 알레르기 정보를 고정 상단 노출',
            '재방문 주기 자동 분석으로 방문 유도 타이밍 추천',
            '고객별 시술 전후 비교 사진 전용 앨범 관리',
            '회원권, 포인트, 미수금 현황 실시간 정산',
        ]
    },
    {
        icon: DollarSign,
        title: '매출 분석 대시보드',
        description: '장부 정리에 들이는 시간을 90% 이상 줄여드리고 비즈니스 성장을 돕습니다.',
        details: [
            '오늘의 정산 내역 자동 집계 및 일일 리포트 생성',
            '객단가 변화 추이 및 선호 시술 랭킹 분석',
            '가장 수익성 높은 시술/제품 집중 분석 리포트',
            '기간별 지출 카테고리 분석으로 고정비 절감 인사이트',
        ]
    },
    {
        icon: Package,
        title: '스마트 재고 컨트롤',
        description: '재고 부족으로 인한 기회 손실을 막아주는 지능형 재고 관리 시스템입니다.',
        details: [
            '시술 등록 시 연결된 소모품 재고 자동 차감 설정',
            '설정한 적정 재고 이하 시 즉시 구매 알림 발송',
            '입고/출고/재고 실사 이력 무기한 보존',
            '제품별 유통기한 관리 및 우선 사용 순위 지정',
        ]
    },
]

const additionalFeatures = [
    {
        icon: BarChart,
        title: '성장 지표 트래킹',
        description: '신규 고객 유입률과 재방문율을 시각화하여 샵의 건강 상태를 진단합니다.',
    },
    {
        icon: Bell,
        title: '자동화 마케팅',
        description: '생일, 기념일, 장기 미방문 고객 대상 맞춤 메시지를 자동 발송합니다.',
    },
    {
        icon: Shield,
        title: '다중 보안 계층',
        description: '데이터는 삼중 백업 시스템을 통해 물리적 재난 상황에서도 보호됩니다.',
    },
    {
        icon: Smartphone,
        title: '네이티브 앱급 경험',
        description: '웹이지만 앱처럼 빠른 반응 속도와 알림 기능을 모바일에서 제공합니다.',
    },
    {
        icon: Cloud,
        title: '언제 어디서나',
        description: '샵은 물론 집에서도, 휴가지에서도 매장 현황을 실시간 관리하세요.',
    },
    {
        icon: Zap,
        title: '초간편 도입',
        description: '회원가입 후 직관적인 튜토리얼로 5분 안에 실무 적용이 가능합니다.',
    },
]

const useCases = [
    {
        title: '1인 샵 원장님: 운영 부담 최소화',
        description: '시술에만 집중하세요. 원장님이 손을 떼지 못하는 예약 전화 응대, 매출 정산, 재고 파악을 BeautyHub가 대신합니다. 하루 평균 1시간 이상의 잡무 시간이 확보됩니다.',
    },
    {
        title: '복수 직원 샵: 성과 관리 및 보안',
        description: '직원별로 처리한 시술액과 제품 판매액이 자동으로 구분되어 인센티브 정산이 투명해집니다. 또한 관리자 전용 메뉴 설정으로 샵 운영 정보가 안전하게 보호됩니다.',
    },
    {
        title: '성장하는 뷰티 브랜드: 데이터 기반 확장',
        description: '단순 감이 아닌 축적된 데이터로 다음 매장 확장 시기나 신규 메뉴 도입을 결정하세요. 고객의 선호도 변화를 수치로 확인하여 트렌드에 기민하게 반응할 수 있습니다.',
    },
]

export default function FeaturesPage() {
    return (
        <Box>
            {/* Hero Section */}
            <Box sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                py: { xs: 8, md: 10 },
                textAlign: 'center'
            }}>
                <Container maxWidth={false} sx={{ maxWidth: { xs: '100%', md: '1200px' }, px: { xs: 1.5, sm: 2, md: 3 }, width: '100%' }}>
                    <Typography variant="h2" component="h1" fontWeight={800} gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
                        강력한 기능, 간편한 사용
                    </Typography>
                    <Typography variant="h5" sx={{ maxWidth: 800, mx: 'auto', lineHeight: 1.8, opacity: 0.95 }}>
                        BeautyHub는 피부관리샵 운영에 필요한 모든 기능을 제공합니다.
                        <br />
                        복잡한 설정 없이 바로 사용할 수 있으며, 누구나 쉽게 배울 수 있습니다.
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth={false} sx={{ py: { xs: 8, md: 10 }, px: { xs: 1.5, sm: 2, md: 3 }, maxWidth: { xs: '100%', md: '1200px' }, width: '100%' }}>
                {/* Main Features */}
                <Box sx={{ mb: 10 }}>
                    <Typography variant="h3" fontWeight={700} gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
                        핵심 기능
                    </Typography>
                    <Grid container spacing={{ xs: 0.75, sm: 1.5, md: 2.5, lg: 4 }}>
                        {mainFeatures.map((feature, index) => {
                            const Icon = feature.icon
                            return (
                                <Grid item xs={12} md={6} key={index}>
                                    <Card sx={{ height: '100%', p: 2 }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <Box sx={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: 2,
                                                    bgcolor: 'primary.light',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    mr: 2
                                                }}>
                                                    <Icon size={24} />
                                                </Box>
                                                <Typography variant="h5" fontWeight={700}>
                                                    {feature.title}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body1" color="text.secondary" paragraph>
                                                {feature.description}
                                            </Typography>
                                            <Stack spacing={1}>
                                                {feature.details.map((detail, idx) => (
                                                    <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                        <CheckCircle size={16} style={{ marginTop: 5, flexShrink: 0, color: '#667eea' }} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {detail}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )
                        })}
                    </Grid>
                </Box>

                {/* Additional Features */}
                <Box sx={{ mb: 10 }}>
                    <Typography variant="h3" fontWeight={700} gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
                        추가 기능
                    </Typography>
                    <Grid container spacing={3}>
                        {additionalFeatures.map((feature, index) => {
                            const Icon = feature.icon
                            return (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <Box sx={{ textAlign: 'center', p: 3, height: '100%', border: '1px solid #eee', borderRadius: 4, '&:hover': { borderColor: 'primary.main', bgcolor: 'grey.50' }, transition: 'all 0.2s' }}>
                                        <Box sx={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: '50%',
                                            bgcolor: 'primary.light',
                                            color: 'primary.main',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mx: 'auto',
                                            mb: 2
                                        }}>
                                            <Icon size={28} />
                                        </Box>
                                        <Typography variant="h6" fontWeight={600} gutterBottom>
                                            {feature.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                                            {feature.description}
                                        </Typography>
                                    </Box>
                                </Grid>
                            )
                        })}
                    </Grid>
                </Box>

                {/* Use Cases */}
                <Box sx={{ mb: 10 }}>
                    <Typography variant="h3" fontWeight={700} gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
                        이런 분들께 추천합니다
                    </Typography>
                    <Stack spacing={2} sx={{ maxWidth: 800, mx: 'auto' }}>
                        {useCases.map((useCase, index) => (
                            <Accordion key={index} disableGutters sx={{ '&:before': { display: 'none' }, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '8px !important' }}>
                                <AccordionSummary expandIcon={<ChevronDown size={20} />}>
                                    <Typography variant="h6" fontWeight={600}>
                                        {useCase.title}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography variant="body1" color="text.secondary" lineHeight={1.8}>
                                        {useCase.description}
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Stack>
                </Box>

                {/* Why Choose Us */}
                <Box sx={{ bgcolor: 'grey.50', borderRadius: 4, p: { xs: 4, md: 6 }, textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight={700} gutterBottom>
                        왜 BeautyHub를 선택해야 할까요?
                    </Typography>
                    <Typography variant="h6" color="text.secondary" paragraph sx={{ maxWidth: 800, mx: 'auto', lineHeight: 1.8 }}>
                        피부관리샵 운영 경험을 바탕으로 실제로 필요한 기능만을 엄선했습니다.
                        복잡한 ERP나 POS 시스템이 아닌, 피부관리샵에 최적화된 솔루션을 경험하세요.
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 3, lineHeight: 1.8 }}>
                        무료로 시작할 수 있으며, 데이터 용량이나 고객 수 제한이 없습니다.
                        이메일만으로 간편하게 가입할 수 있습니다.
                    </Typography>
                </Box>
            </Container>
        </Box>
    )
}
