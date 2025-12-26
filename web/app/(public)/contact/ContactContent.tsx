'use client'

import { Box, Container, Typography, Paper, Stack } from '@mui/material'
import { MessageCircle, Mail, Clock } from 'lucide-react'
import ContactForm from '@/app/components/contact/ContactForm'

export default function ContactContent() {
    return (
        <Box>
            {/* Hero Section */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    py: { xs: 8, md: 10 },
                    textAlign: 'center',
                }}
            >
                <Container maxWidth="lg">
                    <Typography
                        variant="h2"
                        component="h1"
                        fontWeight={800}
                        gutterBottom
                        sx={{ fontSize: { xs: '2rem', md: '3rem' } }}
                    >
                        문의하기
                    </Typography>
                    <Typography variant="h5" sx={{ maxWidth: 800, mx: 'auto', lineHeight: 1.8, opacity: 0.95 }}>
                        궁금한 점이 있으신가요?
                        <br />
                        언제든지 문의해 주세요. 빠른 시일 내에 답변드리겠습니다.
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 4 }}>
                    {/* 문의 양식 */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 3, md: 4 },
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
                            <MessageCircle size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                            문의 작성
                        </Typography>
                        <ContactForm />
                    </Paper>

                    {/* 안내 정보 */}
                    <Stack spacing={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: 'divider',
                                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                            }}
                        >
                            <Typography variant="h6" fontWeight={700} gutterBottom>
                                <Clock size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                                답변 시간
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                                평일 영업시간 내 접수된 문의는 24시간 이내에 답변드립니다.
                                <br />
                                주말 및 공휴일에는 답변이 지연될 수 있습니다.
                            </Typography>
                        </Paper>

                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            <Typography variant="h6" fontWeight={700} gutterBottom>
                                <Mail size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                                기타 문의 방법
                            </Typography>
                            <Stack spacing={1.5} sx={{ mt: 2 }}>
                                <Box>
                                    <Typography variant="body2" fontWeight={600} color="primary">
                                        이메일
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        support@beautyhub.com
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" fontWeight={600} color="primary">
                                        전화
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        1588-0000 (평일 09:00-18:00)
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>

                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: 'divider',
                                background: (theme) =>
                                    theme.palette.mode === 'dark'
                                        ? 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)'
                                        : 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
                            }}
                        >
                            <Typography variant="h6" fontWeight={700} gutterBottom>
                                💡 빠른 해결
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                                자주 묻는 질문(FAQ)에서 원하는 답변을 빠르게 찾아보세요.
                            </Typography>
                            <Typography
                                component="a"
                                href="/faq"
                                variant="body2"
                                fontWeight={600}
                                sx={{
                                    display: 'inline-block',
                                    mt: 1.5,
                                    color: 'primary.main',
                                    textDecoration: 'none',
                                    '&:hover': { textDecoration: 'underline' },
                                }}
                            >
                                FAQ 바로가기 →
                            </Typography>
                        </Paper>
                    </Stack>
                </Box>
            </Container>
        </Box>
    )
}
