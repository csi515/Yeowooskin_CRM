import { createTheme } from '@mui/material/styles'
import { koKR } from '@mui/material/locale'

// 현재 프로젝트의 디자인 토큰을 MUI 테마에 매핑
export const theme = createTheme(
    {
        palette: {
            primary: {
                main: '#4263eb', // action-blue
                light: '#6080f0',
                dark: '#364fc7',
                contrastText: '#ffffff',
            },
            secondary: {
                main: '#6c757d', // cancel-gray
                light: '#868e96',
                dark: '#5a6268',
                contrastText: '#ffffff',
            },
            error: {
                main: '#EF4444', // danger
                light: '#F87171',
                dark: '#DC2626',
                contrastText: '#ffffff',
            },
            success: {
                main: '#10B981',
                light: '#34D399',
                dark: '#059669',
                contrastText: '#ffffff',
            },
            warning: {
                main: '#F59E0B',
                light: '#FBBF24',
                dark: '#D97706',
                contrastText: '#ffffff',
            },
            info: {
                main: '#3B82F6',
                light: '#60A5FA',
                dark: '#2563EB',
                contrastText: '#ffffff',
            },
            background: {
                default: '#F8FAFC',
                paper: '#FFFFFF',
            },
            text: {
                primary: '#1C1917', // neutral-900
                secondary: '#78716C', // neutral-500
                disabled: '#A8A29E', // neutral-400
            },
        },
        typography: {
            fontFamily: 'Pretendard, system-ui, -apple-system, Segoe UI, sans-serif',
            fontSize: 14,
            fontWeightLight: 300,
            fontWeightRegular: 400,
            fontWeightMedium: 500,
            fontWeightBold: 700,
            h1: {
                fontWeight: 700,
                fontSize: '2.5rem',
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
            },
            h2: {
                fontWeight: 700,
                fontSize: '2rem',
                lineHeight: 1.3,
                letterSpacing: '-0.01em',
            },
            h3: {
                fontWeight: 600,
                fontSize: '1.75rem',
                lineHeight: 1.4,
                letterSpacing: '-0.01em',
            },
            h4: {
                fontWeight: 600,
                fontSize: '1.5rem',
                lineHeight: 1.4,
            },
            h5: {
                fontWeight: 600,
                fontSize: '1.25rem',
                lineHeight: 1.5,
            },
            h6: {
                fontWeight: 600,
                fontSize: '1rem',
                lineHeight: 1.6,
            },
            body1: {
                fontSize: '1rem',
                lineHeight: 1.7,
            },
            body2: {
                fontSize: '0.875rem',
                lineHeight: 1.6,
            },
            button: {
                textTransform: 'none', // 버튼 텍스트 대문자 변환 비활성화
                fontWeight: 600,
            },
        },
        shape: {
            borderRadius: 4, // 기본 multiplier (4px). 3 = 12px (rounded-xl)
        },
        breakpoints: {
            values: {
                xs: 0,
                sm: 640,
                md: 768,
                lg: 1024,
                xl: 1280,
            },
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: '0.75rem', // 12px
                        padding: '0.625rem 1.25rem', // 10px 20px
                        minHeight: '44px', // 터치 최소 크기
                        boxShadow: 'none',
                        '&:hover': {
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        },
                        '&:active': {
                            transform: 'scale(0.98)',
                        },
                        transition: 'all 200ms ease-out',
                    },
                    sizeSmall: {
                        minHeight: '40px',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                    },
                    sizeMedium: {
                        minHeight: '44px',
                        padding: '0.625rem 1.25rem',
                        fontSize: '1rem',
                    },
                    sizeLarge: {
                        minHeight: '48px',
                        padding: '0.875rem 2.5rem',
                        fontSize: '1.125rem',
                    },
                },
                defaultProps: {
                    disableElevation: true, // 기본 그림자 비활성화
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        borderRadius: '0.75rem', // 12px (기존 1rem에서 변경)
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    },
                },
                defaultProps: {
                    // 모바일에서 fullScreen 자동 적용
                    fullScreen: false,
                },
            },
            MuiDialogTitle: {
                styleOverrides: {
                    root: {
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        padding: '1.5rem',
                        paddingBottom: '1rem',
                    },
                },
            },
            MuiDialogContent: {
                styleOverrides: {
                    root: {
                        padding: '1.5rem',
                        paddingTop: '0.5rem',
                    },
                },
            },
            MuiDialogActions: {
                styleOverrides: {
                    root: {
                        padding: '1rem 1.5rem',
                        gap: '0.75rem',
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '0.75rem',
                            '& fieldset': {
                                borderColor: '#E7E5E4', // neutral-200
                            },
                            '&:hover fieldset': {
                                borderColor: '#D6D3D1', // neutral-300
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#4263eb', // primary
                                borderWidth: '2px',
                            },
                        },
                    },
                },
                defaultProps: {
                    variant: 'outlined',
                    size: 'medium',
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: '0.75rem',
                        boxShadow: '0 2px 8px rgba(17, 17, 19, 0.06)',
                        border: '1px solid #F5F5F4', // neutral-100
                    },
                },
            },
            MuiAlert: {
                styleOverrides: {
                    root: {
                        borderRadius: '0.75rem',
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        borderRadius: '0.5rem',
                    },
                },
            },
            MuiIconButton: {
                styleOverrides: {
                    root: {
                        // 모바일에서 최소 터치 타겟 크기 보장
                        '@media (max-width: 640px)': {
                            minWidth: '44px',
                            minHeight: '44px',
                        },
                    },
                    sizeSmall: {
                        '@media (max-width: 640px)': {
                            minWidth: '44px',
                            minHeight: '44px',
                        },
                    },
                },
            },
        },
    },
    koKR // 한국어 로케일
)

export default theme
