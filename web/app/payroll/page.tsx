'use client'

import { useState } from 'react'
import { Box, Container, Typography, Paper, Stack, TextField } from '@mui/material'
import { TableSkeleton, CardSkeleton } from '../components/ui/SkeletonLoader'
import { DollarSign, Download, Calculator, Search } from 'lucide-react'
import PageHeader, { createActionButton } from '../components/common/PageHeader'
import { useAppToast } from '../lib/ui/toast'
import InputAdornment from '@mui/material/InputAdornment'
import { Chip } from '@mui/material'

// Components
import PayrollSummaryCards from '../components/payroll/PayrollSummaryCards'
import PayrollStatusSummary from '../components/payroll/PayrollStatusSummary'
import PayrollTable from '../components/payroll/PayrollTable'
import PayrollCalculationModal from '../components/payroll/PayrollCalculationModal'
import PayrollSettingsModal from '../components/modals/PayrollSettingsModal'
import PayrollDetailModal from '../components/modals/PayrollDetailModal'

// Hooks
import { usePayroll } from '../lib/hooks/usePayroll'
import { usePayrollFilters } from '../lib/hooks/usePayrollFilters'

// Utils
import { exportToCSV, preparePayrollDataForExport } from '../lib/utils/export'

// Types
import { type PayrollCalculationResult } from '@/types/payroll'

export default function PayrollPage() {
    // Modal states
    const [calculateModalOpen, setCalculateModalOpen] = useState(false)
    const [settingsModalOpen, setSettingsModalOpen] = useState(false)
    const [detailModalOpen, setDetailModalOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState<any>(null)

    // Calculation modal state
    const [selectedStaffId, setSelectedStaffId] = useState('')
    const [calculationResult, setCalculationResult] = useState<PayrollCalculationResult | null>(null)

    // Settings modal state
    const [settingsStaffId, setSettingsStaffId] = useState('')
    const [settingsStaffName, setSettingsStaffName] = useState('')

    // Bulk calculation state
    const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])
    const [bulkCalculating, setBulkCalculating] = useState(false)

    const toast = useAppToast()

    // Payroll hooks
    const {
        staff,
        records,
        loading,
        selectedMonth,
        setSelectedMonth,
        refreshData,
        calculatePayroll,
        calculateBulkPayroll,
        updatePayrollStatus
    } = usePayroll()

    // Filters hook
    const {
        query,
        setQuery,
        page,
        setPage,
        totalPages,
        statusFilter,
        setStatusFilter,
        filteredStaff,
        paginatedStaff,
        totalGrossPay,
        totalNetPay
    } = usePayrollFilters(staff, records)

    async function handleCalculatePayroll() {
        if (!selectedStaffId) return

        const result = await calculatePayroll(selectedStaffId, selectedMonth)
            setCalculationResult(result)
    }

    async function handleBulkCalculatePayroll() {
        if (selectedStaffIds.length === 0) return

            setBulkCalculating(true)
        await calculateBulkPayroll(selectedStaffIds, selectedMonth)
                setSelectedStaffIds([])
            setBulkCalculating(false)
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

    const openDetailModal = (record: any) => {
        setSelectedRecord(record)
        setDetailModalOpen(true)
    }

    const handleStatusChange = async (record: any, newStatus: 'approved' | 'paid') => {
        await updatePayrollStatus(record.staff_id, record.month, newStatus)
    }


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
                    createActionButton('일괄 계산', () => handleBulkCalculatePayroll(), 'primary', <Calculator size={16} />, bulkCalculating || selectedStaffIds.length === 0),
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
                        onChange={(e) => setSelectedMonth(e.target.value)}
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
            <PayrollSummaryCards
                totalStaffCount={staff.length}
                filteredStaffCount={filteredStaff.length}
                totalGrossPay={totalGrossPay}
                totalNetPay={totalNetPay}
                calculatedRecordsCount={records.length}
                filteredStaffLength={filteredStaff.length}
            />

            {/* 급여 상태 요약 */}
            <PayrollStatusSummary
                records={records}
                filteredStaffLength={filteredStaff.length}
            />

            <PayrollTable
                selectedMonth={selectedMonth}
                records={records}
                selectedStaffIds={selectedStaffIds}
                onSelectedStaffIdsChange={setSelectedStaffIds}
                paginatedStaff={paginatedStaff}
                totalPages={totalPages}
                currentPage={page}
                onPageChange={setPage}
                onSettingsModalOpen={openSettingsModal}
                onDetailModalOpen={openDetailModal}
                onStatusChange={handleStatusChange}
            />

            <PayrollSettingsModal
                open={settingsModalOpen}
                onClose={() => setSettingsModalOpen(false)}
                staffId={settingsStaffId}
                staffName={settingsStaffName}
                onSaved={refreshData}
            />

            <PayrollDetailModal
                open={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                record={selectedRecord}
                staffName={selectedRecord?.staff?.name || undefined}
                onSaved={refreshData}
            />

            <PayrollCalculationModal
                open={calculateModalOpen}
                onClose={closeCalculateModal}
                staff={staff}
                selectedStaffId={selectedStaffId}
                selectedMonth={selectedMonth}
                calculationResult={calculationResult}
                onStaffChange={setSelectedStaffId}
                onMonthChange={setSelectedMonth}
                onCalculate={handleCalculatePayroll}
            />
        </Container>
    )
}
