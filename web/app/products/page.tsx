"use client"

import { useEffect, useState, useMemo, lazy, Suspense } from 'react'
import PageHeader from '../components/PageHeader'
import FilterBar from '../components/filters/FilterBar'
import { Pencil, Plus } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { useAppToast } from '../lib/ui/toast'
import Button from '../components/ui/Button'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../components/ui/Modal'
import { useSearch } from '../lib/hooks/useSearch'
import { useSort } from '../lib/hooks/useSort'
import { usePagination } from '../lib/hooks/usePagination'
import { useForm } from '../lib/hooks/useForm'

const ProductDetailModal = lazy(() => import('../components/modals/ProductDetailModal'))

type Product = { id?: string | number; name: string; price?: number; description?: string; active?: boolean }

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
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable')
  const { sortKey, sortDirection, toggleSort, sortFn } = useSort<Product & Record<string, unknown>>({
    initialKey: 'name',
    initialDirection: 'asc',
  })
  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: 10,
    totalItems: products.length,
  })
  const { page, pageSize, setPage, setPageSize } = pagination
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

  const load = async () => {
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
  }

  useEffect(() => { load() }, [debouncedQuery])

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

  const openCreate = () => {
    setEditing(null)
    form.reset()
    setShowModal(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    form.setValues({
      name: p.name || '',
      price: p.price || 0,
      description: p.description || '',
      active: p.active ?? true,
    })
    setShowModal(true)
  }

  const remove = async (p: Product) => {
    if (!p.id) return
    if (!confirm('삭제하시겠습니까?')) return
    try {
      setLoading(true); setError('')
      const { productsApi } = await import('@/app/lib/api/products')
      await productsApi.delete(String(p.id))
      await load()
      toast.success('제품을 삭제했습니다.')
    } catch (e: any) { setError(e?.message || '에러가 발생했습니다.'); toast.error('삭제 실패', e?.message) } finally { setLoading(false) }
  }

  return (
    <main className="space-y-8">
      <PageHeader
        title="제품 관리"
        subtitle="판매 중인 제품을 등록·수정하고 가격과 설명, 상태를 한눈에 관리하세요."
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={openCreate}
          >
            제품 추가
          </Button>
        }
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <FilterBar>
        <div className="flex flex-wrap items-end gap-4 w-full">
          <div className="flex-1 min-w-0 sm:min-w-[200px]">
            <div className="mb-1.5 text-xs sm:text-[11px] font-medium text-neutral-600">검색</div>
            <div className="relative w-full">
              <input
                className="h-10 sm:h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 sm:px-4 text-sm text-neutral-800 outline-none shadow-sm placeholder:text-neutral-400 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-all duration-fast touch-manipulation"
                placeholder="상품명 또는 설명으로 검색"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[160px]">
            <div className="mb-1.5 text-xs sm:text-[11px] font-medium text-neutral-600">상태</div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="h-10 sm:h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 sm:px-4 text-sm text-neutral-800 outline-none shadow-sm hover:border-neutral-400 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-all duration-fast touch-manipulation"
            >
              <option value="all">전체 상태</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>
        </div>
      </FilterBar>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {loading && Array.from({ length: 8 }).map((_, i) => (
          <div key={`s-${i}`} className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4 sm:p-5">
            <Skeleton className="h-5 w-1/2" />
            <div className="mt-2 h-4 w-1/3 bg-neutral-100 rounded" />
            <div className="mt-3 h-8 w-24 bg-neutral-100 rounded" />
          </div>
        ))}
        {!loading && paginatedProducts.map((p) => (
          <div key={String(p.id)} className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4 sm:p-5 flex flex-col gap-2 sm:gap-3 hover:shadow-md transition-shadow duration-fast">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm text-neutral-500">제품명</div>
                <button className="text-base font-medium underline-offset-2 hover:underline" onClick={() => { setSelected(p as any); setDetailOpen(true) }}>
                  {p.name}
                </button>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${p.active === false ? 'bg-neutral-100 text-neutral-600 border-neutral-200' : 'bg-secondary-50 text-secondary-700 border-secondary-200'}`}>
                {p.active === false ? '비활성' : '활성'}
              </span>
            </div>
            <div className="text-sm text-neutral-600">가격</div>
            <div className="text-lg font-semibold">₩{Number(p.price || 0).toLocaleString()}</div>
            <div className="mt-2 sm:mt-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => { setSelected(p as any); setDetailOpen(true) }}
                aria-label="상세보기"
                title="상세보기"
                className="w-full sm:w-auto h-10 sm:h-9 px-4 sm:px-3 text-sm touch-manipulation"
                leftIcon={<Pencil className="h-4 w-4" />}
              >
                수정
              </Button>
            </div>
          </div>
        ))}
        {!loading && products.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              title="제품이 없습니다."
              actionLabel="제품 추가"
              actionOnClick={openCreate}
            />
          </div>
        )}
      </section>

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
            <div className="grid gap-4 md:grid-cols-[280px,1fr]">
              <div>
                {/* 왼쪽 안내 영역(추후 요약/가이드 추가 가능) */}
              </div>
              <div className="space-y-3 md:border-l md:border-neutral-200 md:pl-6">
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700">이름</label>
                    <input
                      className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-neutral-800 outline-none shadow-sm placeholder:text-neutral-400 focus:ring-2 transition-all duration-fast ${
                        form.errors.name && form.touched.name
                          ? 'border-error-500 focus:border-error-500 focus:ring-error-200'
                          : 'border-neutral-300 focus:border-secondary-500 focus:ring-secondary-200'
                      }`}
                      placeholder="예) 로션 기획세트"
                      value={form.values.name}
                      onChange={e => {
                        form.setValue('name', e.target.value)
                        form.setTouched('name', true)
                      }}
                      onBlur={() => form.validateField('name')}
                    />
                    {form.errors.name && form.touched.name && (
                      <p className="mt-1 text-xs text-error-600">{form.errors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700">가격</label>
                    <input
                      className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-neutral-800 outline-none shadow-sm placeholder:text-neutral-400 focus:ring-2 transition-all duration-fast ${
                        form.errors.price && form.touched.price
                          ? 'border-error-500 focus:border-error-500 focus:ring-error-200'
                          : 'border-neutral-300 focus:border-secondary-500 focus:ring-secondary-200'
                      }`}
                      placeholder="숫자만 입력 (원)"
                      type="number"
                      value={form.values.price}
                      onChange={e => {
                        form.setValue('price', Number(e.target.value) || 0)
                        form.setTouched('price', true)
                      }}
                      onBlur={() => form.validateField('price')}
                    />
                    {form.errors.price && form.touched.price && (
                      <p className="mt-1 text-xs text-error-600">{form.errors.price}</p>
                    )}
                    <p className="mt-1 text-xs text-neutral-500">
                      부가세 포함 여부는 별도 표시 기준을 따릅니다.
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700">설명(선택)</label>
                    <textarea
                      className="min-h-24 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 outline-none shadow-sm placeholder:text-neutral-400 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-all duration-fast"
                      placeholder="간단한 특징, 용량, 구성 등을 입력하세요"
                      value={form.values.description || ''}
                      onChange={e => form.setValue('description', e.target.value)}
                    />
                  </div>
                  <label className="inline-flex items-center space-x-2 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      checked={form.values.active}
                      onChange={e => form.setValue('active', e.target.checked)}
                    />
                    <span>활성</span>
                  </label>
                </div>
              </div>
            </div>
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
        <Suspense fallback={<div>로딩 중...</div>}>
          <ProductDetailModal
            open={detailOpen}
            item={selected as any}
            onClose={() => setDetailOpen(false)}
            onSaved={load}
            onDeleted={load}
          />
        </Suspense>
      )}
    </main>
  )
}
