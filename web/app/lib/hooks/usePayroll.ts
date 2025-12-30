import { useState, useEffect } from 'react'
import { useAppToast } from '../ui/toast'
import { type Staff, type PayrollRecord, type PayrollCalculationResult } from '@/types/payroll'

export function usePayroll(initialMonth?: string) {
    const [staff, setStaff] = useState<Staff[]>([])
    const [records, setRecords] = useState<PayrollRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedMonth, setSelectedMonth] = useState(initialMonth || new Date().toISOString().slice(0, 7))

    const toast = useAppToast()

    useEffect(() => {
        fetchData()
    }, [selectedMonth])

    async function fetchData() {
        try {
            setLoading(true)
            const [staffResponse, recordsResponse] = await Promise.all([
                fetch('/api/staff'),
                fetch(`/api/payroll/records?month=${selectedMonth}`),
            ])

            if (staffResponse.ok) {
                const staffJson = await staffResponse.json()
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
            setStaff([])
            setRecords([])
        } finally {
            setLoading(false)
        }
    }

    async function calculatePayroll(staffId: string, month: string, retryCount = 0): Promise<PayrollCalculationResult | null> {
        try {
            const response = await fetch('/api/payroll/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id: staffId, month }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`
                throw new Error(errorMessage)
            }

            const result = await response.json()
            toast.success('급여가 계산되었습니다')
            fetchData()
            return result
        } catch (error) {
            console.error('Error calculating payroll:', error)
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'

            if (retryCount < 2 && !errorMessage.includes('HTTP')) {
                toast.warning(`${retryCount + 1}회 재시도 중...`)
                await new Promise(resolve => setTimeout(resolve, 1000))
                return calculatePayroll(staffId, month, retryCount + 1)
            }

            toast.error(`급여 계산 실패: ${errorMessage}`)
            return null
        }
    }

    async function calculateBulkPayroll(staffIds: string[], month: string): Promise<void> {
        try {
            let successCount = 0
            let failCount = 0

            for (const staffId of staffIds) {
                try {
                    const response = await fetch('/api/payroll/calculate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ staff_id: staffId, month }),
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
            } else {
                toast.error('모든 급여 계산에 실패했습니다')
            }
        } catch (error) {
            console.error('Bulk calculation error:', error)
            toast.error('일괄 계산 중 오류가 발생했습니다')
        }
    }

    async function updatePayrollStatus(staffId: string, month: string, status: 'approved' | 'paid'): Promise<void> {
        try {
            const response = await fetch('/api/payroll/records', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id: staffId, month, status })
            })

            if (!response.ok) {
                throw new Error('상태 변경에 실패했습니다')
            }

            toast.success(
                status === 'approved' ? '급여가 승인되었습니다' :
                '급여 지급이 확정되었습니다'
            )
            fetchData()
        } catch (error) {
            console.error('Status change error:', error)
            toast.error('상태 변경에 실패했습니다')
        }
    }

    return {
        // Data
        staff,
        records,
        loading,
        selectedMonth,

        // Actions
        setSelectedMonth,
        refreshData: fetchData,
        calculatePayroll,
        calculateBulkPayroll,
        updatePayrollStatus,
    }
}
