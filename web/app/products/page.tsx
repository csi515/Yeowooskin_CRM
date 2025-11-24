"use client"

import { useEffect, useState, useMemo, lazy, Suspense, useCallback } from 'react'
import { Pencil, Plus, Package } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import FloatingActionButton from '../components/common/FloatingActionButton'
import PageHeader, { createActionButton } from '../components/common/PageHeader'
import { useAppToast } from '../lib/ui/toast'
import Button from '../components/ui/Button'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../components/ui/Modal'
import { useSearch } from '../lib/hooks/useSearch'
import { useSort } from '../lib/hooks/useSort'
import { usePagination } from '../lib/hooks/usePagination'
import { useForm } from '../lib/hooks/useForm'
import Pagination from '../components/common/Pagination'

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
  const { sortFn } = useSort<Product & Record<string, unknown>>({
    initialKey: 'name',
    initialDirection: 'asc',
  })
  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: 10,
    totalItems: 0, // filteredProducts.length로 업데이트됨
  })
  const { page, pageSize, setPage, setPageSize, setTotalItems } = pagination
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
  
  // 필터링된 데이터의 길이로 totalItems 업데이트
  useEffect(() => {
    setTotalItems(filteredProducts.length)
  }, [filteredProducts.length, setTotalItems])
  
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
    <main className="space-y-3 sm:space-y-4">
      {error && <p className="text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg p-3">{error}</p>}

      <PageHeader
        title="제품 관리"
        icon={<Package className="h-5 w-5" />}
        description="제품 정보를 관리하고 추가할 수 있습니다"
        search={{
          value: query,
          onChange: setQuery,
          placeholder: '상품명 또는 설명으로 검색',
        }}
        filters={
          <div className="w-full sm:w-auto sm:min-w-[160px]">
            <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5">상태</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm text-neutral-800 outline-none shadow-sm hover:border-neutral-400 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-all duration-200 touch-manipulation"
            >
              <option value="all">전체</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>
        }
        actions={createActionButton('제품 추가', openCreate, 'primary')}
      />

      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
        {loading && Array.from({ length: 12 }).map((_, i) => (
          <div key={`s-${i}`} className="bg-gradient-to-br from-white to-purple-50/30 rounded-lg border border-purple-100 shadow-sm p-2.5 sm:p-3">
            <Skeleton className="h-4 w-3/4 mb-1.5" />
            <div className="mt-1.5 h-3 w-1/2 bg-purple-100 rounded" />
            <div className="mt-2 h-7 w-20 bg-purple-100 rounded" />
          </div>
        ))}
        {!loading && paginatedProducts.map((p, index) => {
          const colorSchemes = [
            { bg: 'from-pink-50 to-rose-100', border: 'border-pink-200', text: 'text-pink-700', label: 'text-pink-600' },
            { bg: 'from-blue-50 to-cyan-100', border: 'border-blue-200', text: 'text-blue-700', label: 'text-blue-600' },
            { bg: 'from-emerald-50 to-teal-100', border: 'border-emerald-200', text: 'text-emerald-700', label: 'text-emerald-600' },
            { bg: 'from-amber-50 to-yellow-100', border: 'border-amber-200', text: 'text-amber-700', label: 'text-amber-600' },
            { bg: 'from-purple-50 to-violet-100', border: 'border-purple-200', text: 'text-purple-700', label: 'text-purple-600' },
            { bg: 'from-indigo-50 to-blue-100', border: 'border-indigo-200', text: 'text-indigo-700', label: 'text-indigo-600' },
          ]
          const scheme = colorSchemes[index % colorSchemes.length]!
          return (
          <div key={String(p.id)} className={`bg-gradient-to-br ${scheme.bg} rounded-lg border ${scheme.border} shadow-sm p-2.5 sm:p-3 flex flex-col gap-1.5 hover:shadow-md transition-all duration-200`}>
            <div className="flex items-start justify-between gap-1.5">
              <div className="min-w-0 flex-1">
                <div className={`text-xs font-medium ${scheme.label} mb-0.5`}>제품명</div>
                <button className={`text-sm font-semibold ${scheme.text} underline-offset-2 hover:underline truncate block w-full text-left`} onClick={() => { setSelected(p); setDetailOpen(true) }}>
                  {p.name}
                </button>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium whitespace-nowrap flex-shrink-0 ${
                p.active === false 
                  ? 'bg-gray-100 text-gray-600 border-gray-200' 
                  : 'bg-emerald-100 text-emerald-700 border-emerald-300'
              }`}>
                {p.active === false ? '비활성' : '활성'}
              </span>
            </div>
            <div className={`text-xs font-medium ${scheme.label}`}>가격</div>
            <div className={`text-base font-bold ${scheme.text}`}>₩{Number(p.price || 0).toLocaleString()}</div>
            <div className="mt-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => { setSelected(p); setDetailOpen(true) }}
                aria-label="상세보기"
                title="상세보기"
                className="w-full h-8 px-2 text-xs touch-manipulation"
                leftIcon={<Pencil className="h-3 w-3" />}
              >
                수정
              </Button>
            </div>
          </div>
        )})}
        {!loading && filteredProducts.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              title={products.length === 0 ? "제품이 없습니다." : "검색 결과가 없습니다."}
              actionLabel="제품 추가"
              actionOnClick={openCreate}
            />
          </div>
        )}
      </section>

      {/* 페이지네이션 */}
      {!loading && filteredProducts.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={filteredProducts.length}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
            pageSizeOptions={[10, 20, 30, 40]}
            showInfo={true}
          />
        </div>
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
            item={selected as import('@/types/entities').Product | null}
            onClose={() => setDetailOpen(false)}
            onSaved={load}
            onDeleted={load}
          />
        </Suspense>
      )}

      {/* 모바일 FAB */}
      <FloatingActionButton
        onClick={openCreate}
        label="제품 추가"
      />
      </main>
  )
}
