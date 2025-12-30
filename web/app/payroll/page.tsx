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
    Stack,
    Chip
} from '@mui/material'
import { TableSkeleton, CardSkeleton } from '../components/ui/SkeletonLoader'
import { DollarSign, FileText, Users, Search, Download, Calculator } from 'lucide-react'
import { Checkbox } from '@mui/material'
import PageHeader, { createActionButton } from '../components/common/PageHeader'
import { useAppToast } from '../lib/ui/toast'
import { format } from 'date-fns'
import { useSearch } from '../lib/hooks/useSearch'
import { usePagination } from '../lib/hooks/usePagination'
import { exportToCSV, preparePayrollDataForExport } from '../lib/utils/export'
import InputAdornment from '@mui/material/InputAdornment'
import Pagination from '@mui/material/Pagination'
import { useMemo } from 'react'
import PayrollSettingsModal from '../components/modals/PayrollSettingsModal'
import PayrollDetailModal from '../components/modals/PayrollDetailModal'

interface Staff {
    id: string
    name: string
    role?: string | null
}

interface PayrollRecord {
    id: string
    owner_id: string
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
    status?: 'draft' | 'calculated' | 'approved' | 'paid'
    staff?: {
        id: string
        name: string
        role?: string | null
    } | null
    // Index signature to satisfy Record<string, unknown>
    [key: string]: unknown;
    // Convenience field for sorting by staff name
    staff_name?: string;
}

export default function PayrollPage() {
    const [staff, setStaff] = useState<Staff[]>([])
    const [records, setRecords] = useState<PayrollRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [calculateModalOpen, setCalculateModalOpen] = useState(false)
    const [selectedStaffId, setSelectedStaffId] = useState('')
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
    const [calculationResult, setCalculationResult] = useState<any>(null)

    // Settings Modal State
    const [settingsModalOpen, setSettingsModalOpen] = useState(false)
    const [settingsStaffId, setSettingsStaffId] = useState('')
    const [settingsStaffName, setSettingsStaffName] = useState('')

    // Detail Modal State
    const [detailModalOpen, setDetailModalOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null)

    // Bulk Calculation State
    const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])
    const [bulkCalculating, setBulkCalculating] = useState(false)

    const toast = useAppToast()

    // Search, Sort, Pagination
    const { query, debouncedQuery, setQuery } = useSearch({ debounceMs: 300 })
    const { page, pageSize, setPage } = usePagination({
        initialPage: 1,
        initialPageSize: 10,
        totalItems: 0
    })

    // Status filter
    const [statusFilter, setStatusFilter] = useState<string>('all')

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
                const staffJson = await staffResponse.json()
                // API 응답이 배열이거나 { data: [...] } 형식 처리
                const staffData = Array.isArray(staffJson)
                    ? staffJson
                    : (staffJson.data || staffJson || [])
                setStaff(Array.isArray(staffData) ? staffData : [])
            } else {
                console.error('Staff API error:', staffResponse.status, staffResponse.statusText)
                setStaff([])
            }

            if (recordsResponse.ok) {
                const recordsJson = await recordsResponse.json()
                // API 응답이 배열이거나 { data: [...] } 형식 처리
                const recordsData = Array.isArray(recordsJson)
                    ? recordsJson
                    : (recordsJson.data || recordsJson || [])
                const processedRecords = Array.isArray(recordsData)
                    ? recordsData.map((r: any) => ({ ...r, staff_name: r.staff?.name }))
                    : []
                setRecords(processedRecords)
            } else {
                console.error('Payroll records API error:', recordsResponse.status, recordsResponse.statusText)
                setRecords([])
            }
        } catch (error) {
            console.error('Error fetching payroll data:', error)
            toast.error('데이터를 불러오는데 실패했습니다')
            // 에러 시 빈 배열로 초기화
            setStaff([])
            setRecords([])
        } finally {
            setLoading(false)
        }
    }

    async function calculatePayroll(retryCount = 0) {
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
                const errorData = await response.json().catch(() => ({}))
                const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`
                throw new Error(errorMessage)
            }

            const result = await response.json()
            setCalculationResult(result)
            toast.success('급여가 계산되었습니다')
            fetchData()
        } catch (error) {
            console.error('Error calculating payroll:', error)
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'

            // 재시도 로직 (최대 2회)
            if (retryCount < 2 && !errorMessage.includes('HTTP')) {
                toast.warning(`${retryCount + 1}회 재시도 중...`)
                setTimeout(() => calculatePayroll(retryCount + 1), 1000)
                return
            }

            toast.error(`급여 계산 실패: ${errorMessage}`)
        }
    }

    async function calculateBulkPayroll() {
        if (selectedStaffIds.length === 0 || !selectedMonth) {
            toast.error('직원을 선택하고 월을 지정해주세요')
            return
        }

        try {
            setBulkCalculating(true)
            let successCount = 0
            let failCount = 0

            for (const staffId of selectedStaffIds) {
                try {
                    const response = await fetch('/api/payroll/calculate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            staff_id: staffId,
                            month: selectedMonth,
                        }),
                    })

                    if (response.ok) {
                        successCount++
                    } else {
                        failCount++
                    }
                } catch (error) {
                    failCount++
                    console.error(`Failed to calculate payroll for staff ${staffId}:`, error)
                }
            }

            if (successCount > 0) {
                toast.success(`${successCount}명의 급여가 계산되었습니다${failCount > 0 ? ` (${failCount}명 실패)` : ''}`)
                fetchData()
                setSelectedStaffIds([])
            } else {
                toast.error('모든 급여 계산에 실패했습니다')
            }
        } catch (error) {
            console.error('Bulk calculation error:', error)
            toast.error('일괄 계산 중 오류가 발생했습니다')
        } finally {
            setBulkCalculating(false)
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

    const openSettingsModal = (staffId: string, staffName: string) => {
        setSettingsStaffId(staffId)
        setSettingsStaffName(staffName)
        setSettingsModalOpen(true)
    }

    const openDetailModal = (record: PayrollRecord) => {
        setSelectedRecord(record)
        setDetailModalOpen(true)
    }

    const handleStatusChange = async (record: PayrollRecord, newStatus: 'approved' | 'paid') => {
        try {
            const response = await fetch('/api/payroll/records', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staff_id: record.staff_id,
                    month: record.month,
                    status: newStatus
                })
            })

            if (!response.ok) {
                throw new Error('상태 변경에 실패했습니다')
            }

            toast.success(
                newStatus === 'approved' ? '급여가 승인되었습니다' :
                '급여 지급이 확정되었습니다'
            )
            fetchData()
        } catch (error) {
            console.error('Status change error:', error)
            toast.error('상태 변경에 실패했습니다')
        }
    }

    const totalGrossPay = records.reduce((sum, r) => sum + r.total_gross, 0)
    const totalNetPay = records.reduce((sum, r) => sum + r.net_salary, 0)

    // Processed Data based on STAFF, not Records
    const filteredStaff = useMemo(() => {
        return staff.filter(s => {
            // Search filter
            if (debouncedQuery.trim()) {
                const qLower = debouncedQuery.toLowerCase()
                if (!s.name.toLowerCase().includes(qLower)) return false
            }

            // Status filter
            if (statusFilter !== 'all') {
                const record = records.find(r => r.staff_id === s.id)
                if (statusFilter === 'not_calculated') {
                    return !record
                } else {
                    return record?.status === statusFilter
                }
            }

            return true
        })
    }, [staff, debouncedQuery, statusFilter, records])

    const sortedStaff = useMemo(() => {
        // Simple name sort for now as main view is staff list
        // If sorting by payroll values is needed, we'd need to join data.
        // For simplicity, let's keep name sort or just default.
        return [...filteredStaff].sort((a, b) => a.name.localeCompare(b.name))
    }, [filteredStaff])

    const paginatedStaff = useMemo(() => {
        const start = (page - 1) * pageSize
        const end = start + pageSize
        return sortedStaff.slice(start, end)
    }, [sortedStaff, page, pageSize])

    const totalPages = Math.max(1, Math.ceil(filteredStaff.length / pageSize))

    const handleExport = () => {
        // Export logic might still want to use RECORDS for the CSV
        // Or we can export all staff and their payroll info if available
        const dataToExport = preparePayrollDataForExport(records)
        exportToCSV(dataToExport, `${selectedMonth}_급여내역.csv`)
        toast.success('CSV 파일이 다운로드되었습니다')
    }


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
                    createActionButton('CSV 내보내기', handleExport, 'secondary', <Download size={16} />),
                    createActionButton('일괄 계산', () => calculateBulkPayroll(), 'primary', <Calculator size={16} />, bulkCalculating || selectedStaffIds.length === 0),
                    createActionButton('급여 계산', () => openCalculateModal(), 'primary'),
                ]}
            />

            {/* 필터 및 검색 */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} variant="outlined">
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                    <TextField
                        type="month"
                        label="조회 월"
                        value={selectedMonth}
                        onChange={(e) => {
                            setSelectedMonth(e.target.value)
                            fetchData()
                        }}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        sx={{ width: { xs: '100%', sm: 200 } }}
                    />
                    <TextField
                        placeholder="직원명 검색"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        size="small"
                        sx={{ flexGrow: 1, width: { xs: '100%', sm: 'auto' } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={16} className="text-gray-400" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Stack>

                {/* 상태 필터 */}
                <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        상태 필터
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        {[
                            { value: 'all', label: '전체', color: 'default' },
                            { value: 'not_calculated', label: '미계산', color: 'default' },
                            { value: 'calculated', label: '계산완료', color: 'warning' },
                            { value: 'approved', label: '승인완료', color: 'info' },
                            { value: 'paid', label: '지급완료', color: 'success' },
                        ].map((filter) => (
                            <Chip
                                key={filter.value}
                                label={filter.label}
                                color={statusFilter === filter.value ? filter.color as any : 'default'}
                                variant={statusFilter === filter.value ? 'filled' : 'outlined'}
                                size="small"
                                onClick={() => setStatusFilter(filter.value)}
                                sx={{ cursor: 'pointer' }}
                            />
                        ))}
                    </Stack>
                </Box>
            </Paper>

            {/* 요약 카드 */}
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
                                {filteredStaff.length}명
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                전체 {staff.length}명 중
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
                                평균 ₩{filteredStaff.length > 0 ? Math.round(totalGrossPay / filteredStaff.length).toLocaleString() : 0}
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
                                {records.length}/{filteredStaff.length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {Math.round((records.length / Math.max(filteredStaff.length, 1)) * 100)}% 완료
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 급여 상태 요약 */}
            {records.length > 0 && (
                <Card sx={{ mb: 4 }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                            급여 처리 현황
                        </Typography>
                        <Grid container spacing={2}>
                            {[
                                { label: '미계산', count: filteredStaff.length - records.length, color: 'default' },
                                { label: '계산완료', count: records.filter(r => r.status === 'calculated').length, color: 'warning' },
                                { label: '승인완료', count: records.filter(r => r.status === 'approved').length, color: 'info' },
                                { label: '지급완료', count: records.filter(r => r.status === 'paid').length, color: 'success' },
                            ].map((status) => (
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
            )}

            <Card>
                <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" fontWeight={600}>
                            {selectedMonth} 급여 관리
                        </Typography>
                        {selectedStaffIds.length > 0 && (
                            <Typography variant="body2" color="primary.main" fontWeight={600}>
                                {selectedStaffIds.length}명 선택됨
                            </Typography>
                        )}
                    </Stack>

                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={paginatedStaff.length > 0 && selectedStaffIds.length === paginatedStaff.length}
                                            indeterminate={selectedStaffIds.length > 0 && selectedStaffIds.length < paginatedStaff.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedStaffIds(paginatedStaff.map(s => s.id))
                                                } else {
                                                    setSelectedStaffIds([])
                                                }
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>직원명</TableCell>
                                    <TableCell align="right">기본급</TableCell>
                                    <TableCell align="right">시급/연장</TableCell>
                                    <TableCell align="right">인센티브</TableCell>
                                    <TableCell align="right">총 지급액</TableCell>
                                    <TableCell align="right">공제액</TableCell>
                                    <TableCell align="right">실지급액</TableCell>
                                    <TableCell align="center">상태</TableCell>
                                    <TableCell align="center">상세보기</TableCell>
                                    <TableCell align="center">관리</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedStaff.map((s) => {
                                    const record = records.find(r => r.staff_id === s.id)
                                    return (
                                        <TableRow key={s.id}>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selectedStaffIds.includes(s.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedStaffIds(prev => [...prev, s.id])
                                                        } else {
                                                            setSelectedStaffIds(prev => prev.filter(id => id !== s.id))
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {s.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {s.role || '직원'}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">
                                                {record ? `₩${record.base_salary.toLocaleString()}` : '-'}
                                            </TableCell>
                                            <TableCell align="right">
                                                {record ? `₩${record.overtime_pay.toLocaleString()}` : '-'}
                                            </TableCell>
                                            <TableCell align="right">
                                                {record ? `₩${record.incentive_pay.toLocaleString()}` : '-'}
                                            </TableCell>
                                            <TableCell align="right">
                                                {record ? (
                                                    <Typography variant="body2" fontWeight={600}>
                                                        ₩{record.total_gross.toLocaleString()}
                                                    </Typography>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: 'error.main' }}>
                                                {record ? `-₩${record.total_deductions.toLocaleString()}` : '-'}
                                            </TableCell>
                                            <TableCell align="right">
                                                {record ? (
                                                    <Typography variant="body2" fontWeight={700} color="success.main">
                                                        ₩{record.net_salary.toLocaleString()}
                                                    </Typography>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell align="center">
                                                {record ? (
                                                    <Chip
                                                        label={
                                                            record.status === 'paid' ? '지급완료' :
                                                            record.status === 'approved' ? '승인완료' :
                                                            record.status === 'calculated' ? '계산완료' :
                                                            '미계산'
                                                        }
                                                        color={
                                                            record.status === 'paid' ? 'success' :
                                                            record.status === 'approved' ? 'info' :
                                                            record.status === 'calculated' ? 'warning' :
                                                            'default'
                                                        }
                                                        size="small"
                                                    />
                                                ) : (
                                                    <Chip label="미계산" color="default" size="small" />
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="primary"
                                                    onClick={() => record && openDetailModal(record)}
                                                    disabled={!record}
                                                >
                                                    보기
                                                </Button>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={1} justifyContent="center">
                                                    {record && record.status === 'calculated' && (
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="success"
                                                            onClick={() => handleStatusChange(record, 'approved')}
                                                        >
                                                            승인
                                                        </Button>
                                                    )}
                                                    {record && record.status === 'approved' && (
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="info"
                                                            onClick={() => handleStatusChange(record, 'paid')}
                                                        >
                                                            지급확정
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="secondary"
                                                        onClick={() => openSettingsModal(s.id, s.name)}
                                                    >
                                                        설정
                                                    </Button>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                                {paginatedStaff.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">
                                                등록된 직원이 없습니다.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    {filteredStaff.length > 0 && (
                        <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={(_, p) => setPage(p)}
                                color="primary"
                                showFirstButton
                                showLastButton
                            />
                        </Stack>
                    )}
                </CardContent>
            </Card>

            <PayrollSettingsModal
                open={settingsModalOpen}
                onClose={() => setSettingsModalOpen(false)}
                staffId={settingsStaffId}
                staffName={settingsStaffName}
                onSaved={() => {
                    // Refresh data or just close
                    // Maybe re-calculate if needed? For now just close.
                }}
            />

            <PayrollDetailModal
                open={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                record={selectedRecord}
                staffName={selectedRecord?.staff?.name || undefined}
                onSaved={fetchData}
            />

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
                        <Button onClick={() => calculatePayroll()} variant="contained">
                            계산하기
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Container>
    )
}
