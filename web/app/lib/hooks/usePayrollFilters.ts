import { useState, useMemo } from 'react'
import { useSearch } from './useSearch'
import { usePagination } from './usePagination'
import { type Staff, type PayrollRecord } from '@/types/payroll'

export function usePayrollFilters(staff: Staff[], records: PayrollRecord[]) {
    const { query, debouncedQuery, setQuery } = useSearch({ debounceMs: 300 })
    const { page, pageSize, setPage } = usePagination({
        initialPage: 1,
        initialPageSize: 10,
        totalItems: 0
    })

    const [statusFilter, setStatusFilter] = useState<string>('all')

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
        return [...filteredStaff].sort((a, b) => a.name.localeCompare(b.name))
    }, [filteredStaff])

    const paginatedStaff = useMemo(() => {
        const start = (page - 1) * pageSize
        const end = start + pageSize
        return sortedStaff.slice(start, end)
    }, [sortedStaff, page, pageSize])

    const totalPages = Math.max(1, Math.ceil(filteredStaff.length / pageSize))

    // Calculations
    const totalGrossPay = records.reduce((sum, r) => sum + r.total_gross, 0)
    const totalNetPay = records.reduce((sum, r) => sum + r.net_salary, 0)

    return {
        // Search
        query,
        setQuery,

        // Pagination
        page,
        pageSize,
        setPage,
        totalPages,

        // Filters
        statusFilter,
        setStatusFilter,

        // Filtered data
        filteredStaff,
        paginatedStaff,

        // Calculations
        totalGrossPay,
        totalNetPay,
    }
}
