"use client"

import { useEffect, useState, useMemo, lazy, Suspense, useCallback } from 'react'
import { Plus, Search } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { useAppToast } from '../lib/ui/toast'
import Button from '../components/ui/Button'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../components/ui/Modal'
import { useSearch } from '../lib/hooks/useSearch'
import { useSort } from '../lib/hooks/useSort'
import { usePagination } from '../lib/hooks/usePagination'
import { useForm } from '../lib/hooks/useForm'

import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import FormControl from '@mui/material/FormControl'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Fab from '@mui/material/Fab'

const ProductDetailModal = lazy(() => import('../components/modals/ProductDetailModal'))

import type { Product } from '@/types/entities'

type ProductForm = {
  name: string
  price: number
  description: string
  active: boolean
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { sortFn } = useSort<Product & Record<string, unknown>>({
    initialKey: 'name',
    initialDirection: 'asc',
  })
  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: 10,
    totalItems: 0,
  })
  const { page, pageSize, setPage } = pagination
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)
  const toast = useAppToast()
  const { query, debouncedQuery, setQuery } = useSearch({ debounceMs: 300 })
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const form = useForm<ProductForm>({
    initialValues: { name: '', price: 0, description: '', active: true },
    validationRules: {
      name: { required: true, minLength: 1 },
      price: { required: true, min: 0 },
    },
    onSubmit: async (values) => {
      try {
        setLoading(true); setError('')
        const { productsApi } = await import('@/app/lib/api/products')
        const body = { name: values.name, price: Number(values.price || 0), description: values.description, active: values.active }
        if (editing?.id) {
          await productsApi.update(String(editing.id), body)
        } else {
          await productsApi.create(body)
        }
        await load()
        setShowModal(false)
        setEditing(null)
        form.reset()
        toast.success('제품이 저장되었습니다.')
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : '에러가 발생했습니다.'
        setError(errorMessage)
        toast.error('저장 실패', errorMessage)
      } finally { setLoading(false) }
    },
  })

  const load = useCallback(async () => {
    try {
      setLoading(true); setError('')
      const { productsApi } = await import('@/app/lib/api/products')
      const rows = await productsApi.list(debouncedQuery ? { search: debouncedQuery } : {})
      setProducts(Array.isArray(rows) ? rows as Product[] : [])
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '에러가 발생했습니다.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery])

  useEffect(() => { load() }, [load])

  // 필터링된 데이터
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (statusFilter === 'active' && !p.active) return false
      if (statusFilter === 'inactive' && p.active) return false
      if (debouncedQuery.trim()) {
        const qLower = debouncedQuery.trim().toLowerCase()
        return (p.name || '').toLowerCase().includes(qLower) || (p.description || '').toLowerCase().includes(qLower)
      }
      return true
    })
  }, [products, statusFilter, debouncedQuery])

  // 정렬된 데이터
  const sortedProducts = useMemo(() => {
    return sortFn(filteredProducts as (Product & Record<string, unknown>)[])
  }, [filteredProducts, sortFn])

  // 페이지네이션된 데이터
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return sortedProducts.slice(start, end)
  }, [sortedProducts, page, pageSize])

  // totalPages 계산 (필터링된 데이터 기준)
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))


  // 페이지 변경 시 필터/검색 변경으로 인해 현재 페이지가 유효 범위를 벗어나면 첫 페이지로 이동
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(1)
    }
  }, [totalPages, page, setPage])

  const openCreate = () => {
    setEditing(null)
    form.reset()
    setShowModal(true)
  }

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 2, borderRadius: 3 }} elevation={0} variant="outlined">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="상품명 또는 설명으로 검색"
            value={query}
            onChange={e => setQuery(e.target.value)}
            size="small"
            fullWidth
            sx={{
              flexGrow: 1,
              '& .MuiOutlinedInput-root': {
                fontSize: { xs: '16px', md: '14px' },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search className="h-4 w-4 text-neutral-400" />
                </InputAdornment>
              ),
            }}
            inputProps={{
              autoComplete: 'off',
              autoCorrect: 'off',
              autoCapitalize: 'off',
            }}
          />
          <FormControl size="small" sx={{ minWidth: 120, flexShrink: 0 }}>
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              displayEmpty
              sx={{
                '& .MuiSelect-select': {
                  whiteSpace: 'nowrap'
                }
              }}
            >
              <MenuItem value="all">전체</MenuItem>
              <MenuItem value="active">활성</MenuItem>
              <MenuItem value="inactive">비활성</MenuItem>
            </Select>
          </FormControl>
          {(query || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('')
                setStatusFilter('all')
              }}
              sx={{ whiteSpace: 'nowrap' }}
            >
              초기화
            </Button>
          )}
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={openCreate}
            sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            제품 추가
          </Button>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
          <AlertTitle>오류 발생</AlertTitle>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {loading && Array.from({ length: 8 }).map((_, i) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={i}>
            <Skeleton className="h-32 rounded-lg" />
          </Grid>
        ))}
        {!loading && paginatedProducts.map((p) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={String(p.id)}>
            <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, '&:hover': { boxShadow: 2 } }}>
              <CardContent sx={{ flexGrow: 1, p: 1.5, pb: 0 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Chip
                    label={p.active ? '활성' : '비활성'}
                    size="small"
                    color={p.active ? 'success' : 'default'}
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.625rem' }}
                  />
                </Stack>
                <Typography variant="subtitle2" component="h3" fontWeight="bold" noWrap title={p.name} mb={0.5}>
                  {p.name}
                </Typography>
                <Typography variant="body2" color="primary.main" fontWeight="bold">
                  ₩{Number(p.price || 0).toLocaleString()}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 1 }}>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => { setSelected(p); setDetailOpen(true) }}
                  fullWidth
                  sx={{ fontSize: '0.75rem', py: 0.5 }}
                >
                  상세보기
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        {!loading && filteredProducts.length === 0 && (
          <Grid item xs={12}>
            <EmptyState
              title={products.length === 0 ? "제품이 없습니다." : "검색 결과가 없습니다."}
              actionLabel="제품 추가"
              actionOnClick={openCreate}
            />
          </Grid>
        )}
      </Grid>

      {/* 페이지네이션 */}
      {!loading && filteredProducts.length > 0 && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems="center" mt={2}>
          <Typography variant="body2" color="text.secondary">
            총 {filteredProducts.length}개
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, p) => setPage(p)}
              color="primary"
              size="medium"
              siblingCount={1}
              shape="rounded"
              sx={{
                '& .MuiPagination-ul': {
                  flexWrap: 'nowrap',
                },
              }}
            />
          </Stack>
        </Stack>
      )}

      {showModal && (
        <Modal
          open={showModal}
          onClose={() => { setShowModal(false); setEditing(null) }}
          size="lg"
        >
          <ModalHeader
            title={editing ? '제품 수정' : '제품 추가'}
            description="제품의 기본 정보를 입력하세요. 이름과 가격은 필수입니다."
          />
          <ModalBody>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="이름"
                fullWidth
                value={form.values.name}
                onChange={e => {
                  form.setValue('name', e.target.value)
                  form.setTouched('name', true)
                }}
                onBlur={() => form.validateField('name')}
                error={Boolean(form.errors.name && form.touched.name)}
                helperText={form.errors.name && form.touched.name ? form.errors.name : undefined}
              />
              <TextField
                label="가격"
                fullWidth
                type="number"
                value={form.values.price}
                onChange={e => {
                  form.setValue('price', Number(e.target.value) || 0)
                  form.setTouched('price', true)
                }}
                onBlur={() => form.validateField('price')}
                error={Boolean(form.errors.price && form.touched.price)}
                helperText={form.errors.price && form.touched.price ? form.errors.price : "부가세 포함 여부는 별도 표시 기준을 따릅니다."}
                InputProps={{
                  endAdornment: <InputAdornment position="end">원</InputAdornment>,
                }}
              />
              <TextField
                label="설명 (선택)"
                fullWidth
                multiline
                rows={3}
                placeholder="간단한 특징, 용량, 구성 등을 입력하세요"
                value={form.values.description || ''}
                onChange={e => form.setValue('description', e.target.value)}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.values.active}
                    onChange={e => form.setValue('active', e.target.checked)}
                  />
                }
                label="활성 상태"
              />
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setShowModal(false)
                setEditing(null)
                form.reset()
              }}
              disabled={loading}
            >
              취소
            </Button>
            <Button
              variant="primary"
              onClick={() => form.handleSubmit()}
              disabled={loading || !form.isValid}
            >
              저장
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {detailOpen && (
        <Suspense fallback={null}>
          <ProductDetailModal
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
        aria-label="제품 추가"
        sx={{
          position: 'fixed',
          bottom: { xs: 72, md: 16 },
          right: 16,
          display: { xs: 'flex', md: 'none' },
        }}
        onClick={openCreate}
      >
        <Plus className="h-5 w-5" />
      </Fab>
    </Stack>
  )
}
