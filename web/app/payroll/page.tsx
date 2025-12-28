'use client'

import { useEffect, useState } from 'react'
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
} from '@mui/material'
import { TableSkeleton, CardSkeleton } from '../components/ui/SkeletonLoader'
import EmptyState from '../components/ui/EmptyState'
import { DollarSign, FileText, Users, FileX } from 'lucide-react'
import PageHeader, { createActionButton } from '../components/common/PageHeader'
import { useAppToast } from '../lib/ui/toast'
import { format } from 'date-fns'

interface Staff {
    id: string
    name: string
    role?: string | null
}

interface PayrollRecord {
    id: string
    staff_id: string
    month: string
    base_salary: number
    overtime_pay: number
    incentive_pay: number
    total_gross: number
    national_pension: number
    health_insurance: number
    employment_insurance: number
    income_tax: number
    total_deductions: number
    net_salary: number
    memo?: string | null
    staff?: {
        id: string
        name: string
        role?: string | null
    } | null
}

export default function PayrollPage() {
    const [staff, setStaff] = useState<Staff[]>([])
    const [records, setRecords] = useState<PayrollRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [calculateModalOpen, setCalculateModalOpen] = useState(false)
    const [selectedStaffId, setSelectedStaffId] = useState('')
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
    const [calculationResult, setCalculationResult] = useState<any>(null)
    const toast = useAppToast()

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            setLoading(true)
            const [staffResponse, recordsResponse] = await Promise.all([
                fetch('/api/staff'),
                fetch(`/api/payroll/records?month=${selectedMonth}`),
            ])

            if (staffResponse.ok) {
                const staffData = await staffResponse.json()
                setStaff(staffData)
            }

            if (recordsResponse.ok) {
                const recordsData = await recordsResponse.json()
                setRecords(recordsData)
            }
        } catch (error) {
            console.error('Error fetching payroll data:', error)
            toast.error('데이터를 불러오는데 실패했습니다')
        } finally {
            setLoading(false)
        }
    }

    async function calculatePayroll() {
        if (!selectedStaffId || !selectedMonth) {
            toast.error('직원과 월을 선택해주세요')
            return
        }

        try {
            const response = await fetch('/api/payroll/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staff_id: selectedStaffId,
                    month: selectedMonth,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to calculate payroll')
            }

            const result = await response.json()
            setCalculationResult(result)
            toast.success('급여가 계산되었습니다')
            fetchData()
        } catch (error) {
            console.error('Error calculating payroll:', error)
            toast.error('급여 계산에 실패했습니다')
        }
    }

    function openCalculateModal() {
        setCalculateModalOpen(true)
        setCalculationResult(null)
    }

    function closeCalculateModal() {
        setCalculateModalOpen(false)
        setCalculationResult(null)
        setSelectedStaffId('')
    }

    const totalGrossPay = records.reduce((sum, r) => sum + r.total_gross, 0)
    const totalNetPay = records.reduce((sum, r) => sum + r.net_salary, 0)


    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <PageHeader
                    title="급여 관리"
                    description="직원 급여 자동 계산 및 관리"
                    icon={<DollarSign />}
                    actions={[]}
                />
                <Box sx={{ mb: 3 }}>
                    <TextField
                        type="month"
                        label="조회 월"
                        value={selectedMonth}
                        InputLabelProps={{ shrink: true }}
                        disabled
                    />
                </Box>
                <Box sx={{ mb: 4 }}>
                    <CardSkeleton count={3} />
                </Box>
                <TableSkeleton rows={5} cols={6} />
            </Container>
        )
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <PageHeader
                title="급여 관리"
                description="직원 급여 자동 계산 및 관리"
                icon={<DollarSign />}
                actions={[
                    createActionButton('급여 계산', openCalculateModal, 'primary'),
                ]}
            />

            {/* 월 선택 */}
            <Box sx={{ mb: 3 }}>
                <TextField
                    type="month"
                    label="조회 월"
                    value={selectedMonth}
                    onChange={(e) => {
                        setSelectedMonth(e.target.value)
                        fetchData()
                    }}
                    InputLabelProps={{ shrink: true }}
                />
            </Box>

            {/* 요약 카드 */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Users size={20} color="#667eea" />
                                <Typography variant="body2" color="text.secondary">
                                    급여 지급 인원
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight={700}>
                                {records.length}명
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
                                    총 지급액 (세전)
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight={700} color="success.main">
                                ₩{totalGrossPay.toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <FileText size={20} color="#667eea" />
                                <Typography variant="body2" color="text.secondary">
                                    실지급액 (세후)
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight={700}>
                                ₩{totalNetPay.toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 급여 내역 테이블 */}
            {records.length === 0 ? (
                <EmptyState
                    icon={FileX}
                    title="급여 기록이 없습니다"
                    description={`${selectedMonth}월에 지급된 급여 내역이 없습니다. 급여 계산을 진행해주세요.`}
                    actionLabel="급여 계산"
                    onAction={openCalculateModal}
                />
            ) : (
                <Card>
                    <CardContent>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            {selectedMonth} 급여 내역
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>직원명</TableCell>
                                        <TableCell align="right">기본급</TableCell>
                                        <TableCell align="right">시급/연장</TableCell>
                                        <TableCell align="right">인센티브</TableCell>
                                        <TableCell align="right">총 지급액</TableCell>
                                        <TableCell align="right">공제액</TableCell>
                                        <TableCell align="right">실지급액</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {records.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {record.staff?.name || '-'}
                                                    </Typography>
                                                    {record.staff?.role && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {record.staff.role}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">₩{record.base_salary.toLocaleString()}</TableCell>
                                            <TableCell align="right">₩{record.overtime_pay.toLocaleString()}</TableCell>
                                            <TableCell align="right">₩{record.incentive_pay.toLocaleString()}</TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontWeight={600}>
                                                    ₩{record.total_gross.toLocaleString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: 'error.main' }}>
                                                -₩{record.total_deductions.toLocaleString()}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontWeight={700} color="success.main">
                                                    ₩{record.net_salary.toLocaleString()}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            {/* 급여 계산 모달 */}
            <Dialog open={calculateModalOpen} onClose={closeCalculateModal} maxWidth="md" fullWidth>
                <DialogTitle>급여 자동 계산</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>직원 선택</InputLabel>
                            <Select
                                value={selectedStaffId}
                                onChange={(e) => setSelectedStaffId(e.target.value)}
                                label="직원 선택"
                            >
                                {staff.map((s) => (
                                    <MenuItem key={s.id} value={s.id}>
                                        {s.name} {s.role && `(${s.role})`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            type="month"
                            label="계산 월"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />

                        {calculationResult && (
                            <Box sx={{ mt: 2 }}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    계산 결과
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Paper variant="outlined" sx={{ p: 2 }}>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                총 근무시간
                                            </Typography>
                                            <Typography variant="h6">
                                                {calculationResult.calculation_details?.total_work_hours || 0}시간
                                            </Typography>
                                        </Paper>
                                    </Grid>

                                    <Grid item xs={4}>
                                        <Paper variant="outlined" sx={{ p: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                기본급
                                            </Typography>
                                            <Typography variant="body1" fontWeight={600}>
                                                ₩{(calculationResult.calculation_details?.base_salary || 0).toLocaleString()}
                                            </Typography>
                                        </Paper>
                                    </Grid>

                                    <Grid item xs={4}>
                                        <Paper variant="outlined" sx={{ p: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                시급
                                            </Typography>
                                            <Typography variant="body1" fontWeight={600}>
                                                ₩{(calculationResult.calculation_details?.hourly_pay || 0).toLocaleString()}
                                            </Typography>
                                        </Paper>
                                    </Grid>

                                    <Grid item xs={4}>
                                        <Paper variant="outlined" sx={{ p: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                인센티브
                                            </Typography>
                                            <Typography variant="body1" fontWeight={600}>
                                                ₩{(calculationResult.calculation_details?.incentive_pay || 0).toLocaleString()}
                                            </Typography>
                                        </Paper>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.light' }}>
                                            <Typography variant="body2" color="success.dark" gutterBottom>
                                                총 지급액 (세전)
                                            </Typography>
                                            <Typography variant="h5" fontWeight={700}>
                                                ₩{(calculationResult.calculation_details?.total_gross || 0).toLocaleString()}
                                            </Typography>
                                        </Paper>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Typography variant="body2" fontWeight={600} gutterBottom>
                                            공제 내역
                                        </Typography>
                                        <Grid container spacing={1}>
                                            <Grid item xs={6}>
                                                <Typography variant="caption">국민연금</Typography>
                                                <Typography variant="body2">
                                                    -₩{(calculationResult.calculation_details?.deductions?.national_pension || 0).toLocaleString()}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="caption">건강보험</Typography>
                                                <Typography variant="body2">
                                                    -₩{(calculationResult.calculation_details?.deductions?.health_insurance || 0).toLocaleString()}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="caption">고용보험</Typography>
                                                <Typography variant="body2">
                                                    -₩{(calculationResult.calculation_details?.deductions?.employment_insurance || 0).toLocaleString()}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="caption">소득세</Typography>
                                                <Typography variant="body2">
                                                    -₩{(calculationResult.calculation_details?.deductions?.income_tax || 0).toLocaleString()}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.light' }}>
                                            <Typography variant="body2" color="primary.dark" gutterBottom>
                                                실지급액 (세후)
                                            </Typography>
                                            <Typography variant="h4" fontWeight={700}>
                                                ₩{(calculationResult.calculation_details?.net_salary || 0).toLocaleString()}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeCalculateModal}>닫기</Button>
                    {!calculationResult && (
                        <Button onClick={calculatePayroll} variant="contained">
                            계산하기
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Container>
    )
}
