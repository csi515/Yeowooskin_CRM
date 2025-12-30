'use client'

import { Pencil, Plus, Search, Phone, Mail, Package, Download } from 'lucide-react'
import { useEffect, useState, useMemo, lazy, Suspense, useCallback } from 'react'
import EmptyState from '../components/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import CustomerHoldingsBadge from '../components/CustomerHoldingsBadge'
import Button from '../components/ui/Button'
import type { Customer } from '@/types/entities'
import { useSearch } from '../lib/hooks/useSearch'
import { usePagination } from '../lib/hooks/usePagination'
import { useSort } from '../lib/hooks/useSort'
import { exportToCSV, prepareCustomerDataForExport } from '../lib/utils/export'
import { useAppToast } from '../lib/ui/toast'

// MUI Imports
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import Checkbox from '@mui/material/Checkbox'

import TableContainer from '@mui/material/TableContainer'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableSortLabel from '@mui/material/TableSortLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Pagination from '@mui/material/Pagination'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Fab from '@mui/material/Fab'
import Chip from '@mui/material/Chip'
import InputLabel from '@mui/material/InputLabel'

const CustomerDetailModal = lazy(() => import('../components/modals/CustomerDetailModal'))

export default function CustomersPage() {
  const [rows, setRows] = useState<Customer[]>([])
  const { query, debouncedQuery, setQuery } = useSearch({ debounceMs: 300 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Customer | null>(null)
  const toast = useAppToast()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Filters
  const [vipFilter, setVipFilter] = useState<'all' | 'vip' | 'normal'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [minPoints, setMinPoints] = useState('')
  const [maxPoints, setMaxPoints] = useState('')

  const { sortKey, sortDirection, toggleSort, sortFn } = useSort<Customer & Record<string, unknown>>({
    initialKey: 'name',
    initialDirection: 'asc',
  })

  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: 10,
    totalItems: rows.length,
  })
  const { page, pageSize, setPage, setPageSize } = pagination

  const [pointsByCustomer, setPointsByCustomer] = useState<Record<string, number>>({})
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([])

  const load = useCallback(async () => {
    try {
      setLoading(true); setError('')
      const { customersApi } = await import('@/app/lib/api/customers')
      const data = await customersApi.list(debouncedQuery ? { search: debouncedQuery } : {})
      setRows(Array.isArray(data) ? data : [])
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '에러가 발생했습니다.'
      setError(errorMessage)
    } finally { setLoading(false) }
  }, [debouncedQuery])

  useEffect(() => { load() }, [load])

  // Filter and sort logic
  const filteredRows = useMemo(() => {
    return rows.filter(customer => {
      const points = pointsByCustomer[customer.id] || 0

      // Status filter
      if (statusFilter === 'active' && customer.active === false) return false
      if (statusFilter === 'inactive' && customer.active !== false) return false

      // VIP filter (assuming VIP = points > 1000)
      if (vipFilter === 'vip' && points <= 1000) return false
      if (vipFilter === 'normal' && points > 1000) return false

      // Points range filter
      if (minPoints && points < Number(minPoints)) return false
      if (maxPoints && points > Number(maxPoints)) return false

      return true
    })
  }, [rows, pointsByCustomer, statusFilter, vipFilter, minPoints, maxPoints])

  // 정렬된 데이터
  const sortedRows = useMemo(() => {
    return sortFn(filteredRows as (Customer & Record<string, unknown>)[])
  }, [filteredRows, sortFn])

  // 페이지네이션된 데이터
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return sortedRows.slice(start, end)
  }, [sortedRows, page, pageSize])

  // Update totalPages based on filtered data
  const filteredTotalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))

  // CSV export function
  const handleExport = () => {
    const dataToExport = prepareCustomerDataForExport(filteredRows)
    exportToCSV(dataToExport, `고객목록_${new Date().toISOString().slice(0, 10)}.csv`)
    toast.success('CSV 파일이 다운로드되었습니다')
  }

  // Reset filters
  const handleResetFilters = () => {
    setStatusFilter('all')
    setVipFilter('all')
    setMinPoints('')
    setMaxPoints('')
  }

  // 포인트 조회 최적화 - 전체 고객 데이터에 대해 한 번에 조회
  useEffect(() => {
    const fetchPoints = async () => {
      if (!filteredRows.length) return

      try {
        const { pointsApi } = await import('@/app/lib/api/points')

        // 아직 조회하지 않은 고객만 조회
        const customersToFetch = filteredRows.filter(c => !(c.id in pointsByCustomer))

        if (customersToFetch.length === 0) return

        // 최대 5개씩 동시에 조회하여 API 부하 감소
        const batchSize = 5
        const batches = []
        for (let i = 0; i < customersToFetch.length; i += batchSize) {
          batches.push(customersToFetch.slice(i, i + batchSize))
        }

        for (const batch of batches) {
          const promises = batch.map(async (c) => {
            try {
              const data = await pointsApi.getBalance(c.id, { withLedger: false })
              const balance = Number(data?.balance || 0)
              return [c.id, balance] as [string, number]
            } catch {
              return [c.id, 0] as [string, number]
            }
          })

          const results = await Promise.all(promises)
          setPointsByCustomer(prev => ({ ...prev, ...Object.fromEntries(results) }))

          // 배치 간 약간의 지연으로 API 부하 감소
          if (batches.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }
      } catch (error) {
        console.error('포인트 조회 중 오류:', error)
      }
    }

    fetchPoints()
  }, [filteredRows, pointsByCustomer])

  return (
    <Stack spacing={3}>
      {/* 통합 검색 및 필터 바 */}
      <Paper sx={{ p: 3, borderRadius: 3 }} elevation={0} variant="outlined">
        <Stack spacing={3}>
          {/* 검색 및 기본 액션 */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
            <TextField
              placeholder="이름, 이메일 또는 전화번호로 검색"
              value={query}
              onChange={e => setQuery(e.target.value)}
              size="small"
              fullWidth
              sx={{
                maxWidth: { sm: 400 },
                '& .MuiOutlinedInput-root': {
                  fontSize: { xs: '16px', md: '14px' },
                },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search className="h-4 w-4 text-neutral-400" />
                    </InputAdornment>
                  ),
                },
              }}
              inputProps={{
                autoComplete: 'off',
                autoCorrect: 'off',
                autoCapitalize: 'off',
              }}
            />
            <Stack direction="row" spacing={1}>
              {!isMobile && (
                <Button
                  variant="secondary"
                  leftIcon={<Download className="h-4 w-4" />}
                  onClick={handleExport}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  CSV 내보내기
                </Button>
              )}
              <Button
                variant="primary"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  setSelected({ id: '', owner_id: '', name: '', phone: '', email: '', address: '' } as Customer)
                  setDetailOpen(true)
                }}
                fullWidth={false}
                sx={{ width: { xs: '100%', sm: 'auto' }, whiteSpace: 'nowrap' }}
              >
                새 고객
              </Button>
            </Stack>
          </Stack>

          {/* 인라인 필터 */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              필터:
            </Typography>

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>상태</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                label="상태"
              >
                <MenuItem value="all">전체</MenuItem>
                <MenuItem value="active">활성</MenuItem>
                <MenuItem value="inactive">비활성</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>VIP 등급</InputLabel>
              <Select
                value={vipFilter}
                onChange={(e) => setVipFilter(e.target.value as 'all' | 'vip' | 'normal')}
                label="VIP 등급"
              >
                <MenuItem value="all">전체</MenuItem>
                <MenuItem value="vip">VIP (1000P 이상)</MenuItem>
                <MenuItem value="normal">일반</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="최소 포인트"
              type="number"
              size="small"
              value={minPoints}
              onChange={(e) => setMinPoints(e.target.value)}
              sx={{ width: 120 }}
            />

            <TextField
              label="최대 포인트"
              type="number"
              size="small"
              value={maxPoints}
              onChange={(e) => setMaxPoints(e.target.value)}
              sx={{ width: 120 }}
            />

            {(vipFilter !== 'all' || minPoints || maxPoints) && (
              <Button
                variant="ghost"
                onClick={handleResetFilters}
                size="sm"
                sx={{ ml: 1 }}
              >
                초기화
              </Button>
            )}

            {/* 필터 상태 표시 */}
            {(vipFilter !== 'all' || minPoints || maxPoints) && (
              <Chip
                label={`${filteredRows.length}/${rows.length}명 표시`}
                size="small"
                color="info"
                variant="outlined"
              />
            )}
          </Box>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
          <AlertTitle>오류 발생</AlertTitle>
          {error}
        </Alert>
      )}

      {/* 모바일 카드 뷰 (md 미만) */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Stack spacing={2}>
          {loading && Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
          {!loading && paginatedRows.map((c) => (
            <Card key={c.id} sx={{ borderRadius: 3 }} variant="outlined">
              <CardContent sx={{ pb: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" fontWeight="bold">{c.name}</Typography>
                    <Chip
                      label={c.active !== false ? '활성' : '비활성'}
                      size="small"
                      color={c.active !== false ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => { setSelected(c); setDetailOpen(true) }}
                    aria-label="고객 수정"
                    sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}
                  >
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                </Stack>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1} color="text.secondary">
                    <Phone className="h-4 w-4" />
                    <Typography variant="body2">{c.phone || '-'}</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1} color="text.secondary">
                    <Mail className="h-4 w-4" />
                    <Typography variant="body2" noWrap>{c.email || '-'}</Typography>
                  </Stack>
                  <Divider sx={{ my: 1 }} />
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Package className="h-4 w-4 text-neutral-400" />
                      <CustomerHoldingsBadge customerId={c.id} />
                    </Stack>
                    <Typography fontWeight="bold" color="warning.main">
                      {Number(pointsByCustomer[c.id] ?? 0).toLocaleString()} P
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>

      {/* 선택된 고객 표시 및 일괄 작업 */}
      {selectedCustomerIds.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'primary.light', border: '1px solid', borderColor: 'primary.main' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body1" fontWeight={600} color="primary.dark">
              {selectedCustomerIds.length}명의 고객이 선택되었습니다
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  // TODO: 일괄 상태 변경 기능 구현
                  toast.info('일괄 상태 변경 기능은 곧 추가됩니다')
                }}
              >
                상태 변경
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCustomerIds([])}
              >
                선택 해제
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* 데스크톱 테이블 뷰 (md 이상) */}
      <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 3, display: { xs: 'none', md: 'block' } }}>
        <Table role="table" aria-label="고객 목록 테이블">
          <TableHead sx={{ bgcolor: 'neutral.50' }}>
            <TableRow>
              <TableCell padding="checkbox">
                  <Checkbox
                    checked={paginatedRows.length > 0 && selectedCustomerIds.length === paginatedRows.length}
                    indeterminate={selectedCustomerIds.length > 0 && selectedCustomerIds.length < paginatedRows.length}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      if (e.target.checked) {
                        setSelectedCustomerIds(paginatedRows.map(c => c.id))
                      } else {
                        setSelectedCustomerIds([])
                      }
                    }}
                  />
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortKey === 'name'}
                  direction={sortKey === 'name' ? sortDirection : 'asc'}
                  onClick={() => toggleSort('name')}
                >
                  이름
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortKey === 'phone'}
                  direction={sortKey === 'phone' ? sortDirection : 'asc'}
                  onClick={() => toggleSort('phone')}
                >
                  연락처
                </TableSortLabel>
              </TableCell>
              <TableCell>이메일</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>보유상품</TableCell>
              <TableCell align="right">포인트</TableCell>
              <TableCell align="center">관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
          {loading && Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell colSpan={7}>
                <Skeleton className="h-10" aria-label="고객 데이터 로딩 중" />
              </TableCell>
            </TableRow>
          ))}
            {!loading && paginatedRows.map((c) => (
              <TableRow
                key={c.id}
                hover
                sx={{ cursor: 'pointer' }}
                tabIndex={0}
                role="button"
                aria-label={`${c.name} 고객 정보`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelected(c)
                    setDetailOpen(true)
                  }
                }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedCustomerIds.includes(c.id)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      e.stopPropagation()
                      if (e.target.checked) {
                        setSelectedCustomerIds(prev => [...prev, c.id])
                      } else {
                        setSelectedCustomerIds(prev => prev.filter(id => id !== c.id))
                      }
                    }}
                  />
                </TableCell>
                <TableCell
                  title={c.name}
                  sx={{ fontWeight: 500 }}
                  onClick={() => { setSelected(c); setDetailOpen(true) }}
                >
                  {c.name}
                </TableCell>
                <TableCell onClick={() => { setSelected(c); setDetailOpen(true) }}>{c.phone || '-'}</TableCell>
                <TableCell onClick={() => { setSelected(c); setDetailOpen(true) }}>{c.email || '-'}</TableCell>
                <TableCell onClick={() => { setSelected(c); setDetailOpen(true) }}>
                  <Chip
                    label={c.active !== false ? '활성' : '비활성'}
                    size="small"
                    color={c.active !== false ? 'success' : 'default'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell onClick={() => { setSelected(c); setDetailOpen(true) }}><CustomerHoldingsBadge customerId={c.id} /></TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'warning.main' }} onClick={() => { setSelected(c); setDetailOpen(true) }}>
                  {Number(pointsByCustomer[c.id] ?? 0).toLocaleString()}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); setSelected(c); setDetailOpen(true) }}
                    aria-label="고객 수정"
                    sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}
                  >
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <EmptyState
                    title="고객 데이터가 없습니다."
                    actionLabel="새 고객"
                    actionOnClick={() => {
                      setSelected({ id: '', owner_id: '', name: '', phone: '', email: '', address: '', active: true } as Customer)
                      setDetailOpen(true)
                    }}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 페이지네이션 (공통) */}
      {!loading && rows.length > 0 && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            총 {filteredRows.length}명 · {page} / {filteredTotalPages} 페이지
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small">
              <Select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                sx={{ minWidth: 100, bgcolor: 'background.paper' }}
              >
                <MenuItem value={10}>10개씩</MenuItem>
                <MenuItem value={20}>20개씩</MenuItem>
                <MenuItem value={50}>50개씩</MenuItem>
              </Select>
            </FormControl>
            <Pagination
              count={filteredTotalPages}
              page={page}
              onChange={(_, p) => setPage(p)}
              color="primary"
              shape="rounded"
              size="medium"
              siblingCount={1}
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPagination-ul': {
                  flexWrap: 'nowrap',
                },
              }}
            />
          </Stack>
        </Stack>
      )}

      {detailOpen && (
        <Suspense fallback={null}>
          <CustomerDetailModal
            open={detailOpen}
            item={selected}
            onClose={() => setDetailOpen(false)}
            onSaved={load}
            onDeleted={load}
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
  )
}
