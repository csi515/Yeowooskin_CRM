'use client'

import { Plus } from 'lucide-react'
import { useState, lazy, Suspense } from 'react'
import { useAppToast } from '../lib/ui/toast'
import { exportToCSV, prepareCustomerDataForExport } from '../lib/utils/export'

// MUI Imports
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Fab from '@mui/material/Fab'

// Components
import CustomerFilters from '../components/customers/CustomerFilters'
import CustomerTable from '../components/customers/CustomerTable'
import CustomerCards from '../components/customers/CustomerCards'
import CustomerPagination from '../components/customers/CustomerPagination'

// Hooks
import { useCustomers } from '../lib/hooks/useCustomers'
import { useCustomerFilters } from '../lib/hooks/useCustomerFilters'
import { useSearch } from '../lib/hooks/useSearch'

// Types
import { type Customer } from '@/types/entities'
import { type CustomerFilters as CustomerFiltersType } from '@/types/customer'

const CustomerDetailModal = lazy(() => import('../components/modals/CustomerDetailModal'))

export default function CustomersPage() {
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Customer | null>(null)
  const toast = useAppToast()

  // Search
  const { query, setQuery } = useSearch({ debounceMs: 300 })

  // Filters state
  const [filters, setFilters] = useState<CustomerFiltersType>({
    statusFilter: 'all',
    vipFilter: 'all',
    minPoints: '',
    maxPoints: ''
  })

  // Customer data hook
  const {
    customers,
    loading,
    error,
    selectedCustomerIds,
    pointsByCustomer,
    refreshCustomers,
    updateSelectedCustomerIds
  } = useCustomers(query)

  // Filters and pagination hook
  const {
    sortKey,
    sortDirection,
    toggleSort,
    page,
    pageSize,
    setPage,
    setPageSize,
    filteredTotalPages,
    filteredRows,
    paginatedRows
  } = useCustomerFilters(customers, pointsByCustomer, filters)

  // CSV export function
  const handleExport = () => {
    const dataToExport = prepareCustomerDataForExport(filteredRows)
    exportToCSV(dataToExport, `고객목록_${new Date().toISOString().slice(0, 10)}.csv`)
    toast.success('CSV 파일이 다운로드되었습니다')
  }

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      statusFilter: 'all',
      vipFilter: 'all',
      minPoints: '',
      maxPoints: ''
    })
  }

  // Update filters
  const handleFiltersChange = (newFilters: Partial<CustomerFiltersType>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }


  return (
    <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: 4, maxWidth: { xs: '100%', md: '1200px' }, mx: 'auto', width: '100%' }}>
      <Stack spacing={3}>
      {/* 필터 및 검색 */}
      <CustomerFilters
        query={query}
        onQueryChange={setQuery}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onResetFilters={handleResetFilters}
        onExport={handleExport}
        onCreateCustomer={() => {
          setSelected({ id: '', owner_id: '', name: '', phone: '', email: '', address: '' } as Customer)
          setDetailOpen(true)
        }}
        filteredCount={filteredRows.length}
        totalCount={customers.length}
      />

      {error && (
        <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
          <AlertTitle>오류 발생</AlertTitle>
          {error}
        </Alert>
      )}

      {/* 모바일 카드 뷰 */}
      <CustomerCards
        customers={customers}
        paginatedCustomers={paginatedRows}
        loading={loading}
        pointsByCustomer={pointsByCustomer}
        onCustomerClick={(customer) => {
          setSelected(customer)
          setDetailOpen(true)
        }}
      />


      {/* 데스크톱 테이블 뷰 */}
      <CustomerTable
        customers={customers}
        paginatedCustomers={paginatedRows}
        loading={loading}
        selectedCustomerIds={selectedCustomerIds}
        onSelectedCustomerIdsChange={updateSelectedCustomerIds}
        pointsByCustomer={pointsByCustomer}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortToggle={toggleSort}
        onCustomerClick={(customer) => {
          setSelected(customer)
          setDetailOpen(true)
        }}
        onCreateCustomer={() => {
          setSelected({ id: '', owner_id: '', name: '', phone: '', email: '', address: '', active: true } as Customer)
          setDetailOpen(true)
        }}
      />

      {/* 페이지네이션 및 일괄 작업 */}
      <CustomerPagination
        loading={loading}
        filteredCount={filteredRows.length}
        page={page}
        pageSize={pageSize}
        totalPages={filteredTotalPages}
        onPageChange={setPage}
        onPageSizeChange={(newPageSize) => {
          setPageSize(newPageSize)
          setPage(1)
        }}
        selectedCustomerIds={selectedCustomerIds}
        onClearSelection={() => updateSelectedCustomerIds([])}
      />

      {detailOpen && (
        <Suspense fallback={null}>
          <CustomerDetailModal
            open={detailOpen}
            item={selected}
            onClose={() => setDetailOpen(false)}
            onSaved={refreshCustomers}
            onDeleted={refreshCustomers}
          />
        </Suspense>
      )}

      {/* Mobile FAB */}
      <Fab
        color="primary"
        aria-label="새 고객 추가"
        sx={{
          position: 'fixed',
          bottom: { xs: 72, md: 16 },
          right: 16,
          display: { xs: 'flex', md: 'none' },
        }}
        onClick={() => {
          setSelected({ id: '', owner_id: '', name: '', phone: '', email: '', address: '' } as Customer)
          setDetailOpen(true)
        }}
      >
        <Plus className="h-5 w-5" />
      </Fab>
    </Stack>
    </Box>
  )
}
