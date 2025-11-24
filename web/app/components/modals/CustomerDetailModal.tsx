'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../ui/Modal'
import { BottomSheet } from '../ui/BottomSheet'
import Button from '../ui/Button'
import Tabs, { TabsContent, TabsList, TabsTrigger } from '../ui/Tabs'
import { useAppToast } from '@/app/lib/ui/toast'
import { useMobile } from '@/app/lib/hooks/useMobile'
import { hapticFeedback } from '@/app/lib/utils/haptic'
import CustomerSummaryBar from './customer-detail/CustomerSummaryBar'
import CustomerOverviewTab from './customer-detail/CustomerOverviewTab'
import CustomerPointsTab from './customer-detail/CustomerPointsTab'
import CustomerHoldingsTab from './customer-detail/CustomerHoldingsTab'
import CustomerTreatmentHistoryTab from './customer-detail/CustomerTreatmentHistoryTab'
import CustomerProgramsTab from './customer-detail/CustomerProgramsTab'
import { customersApi } from '@/app/lib/api/customers'
import { productsApi } from '@/app/lib/api/products'
import { customerProductsApi } from '@/app/lib/api/customer-products'
import { pointsApi } from '@/app/lib/api/points'

import type { CustomerProduct } from '@/app/lib/repositories/customer-products.repository'
import type { Customer, CustomerCreateInput, CustomerUpdateInput } from '@/types/entities'

type Holding = CustomerProduct

export default function CustomerDetailModal({
  open,
  onClose,
  item,
  onSaved,
  onDeleted
}: {
  open: boolean
  onClose: () => void
  item: Customer | null
  onSaved: () => void
  onDeleted: () => void
}) {
  const [form, setForm] = useState<Customer | null>(item)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useAppToast()
  const [features, setFeatures] = useState<string>('')
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [products, setProducts] = useState<{ id: string | number; name: string }[]>([])
  const [newProductId, setNewProductId] = useState<string>('')
  const [newQty, setNewQty] = useState<number>(1)
  const [newReason, setNewReason] = useState<string>('')
  // points
  const [pointsBalance, setPointsBalance] = useState<number>(0)
  const [pointsDelta, setPointsDelta] = useState<number>(0)
  const [pointsReason, setPointsReason] = useState<string>('')
  const [initialPoints, setInitialPoints] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<'overview' | 'points' | 'holdings' | 'treatments' | 'programs'>('overview')
  // history/report filters
  const [ledger, setLedger] = useState<{ created_at: string; delta: number; reason?: string }[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [histPage, setHistPage] = useState(1)
  const pageSize = 5
  const [hasNext, setHasNext] = useState(false)
  // holdings reason/history state
  const [holdingReason, setHoldingReason] = useState<Record<string, string>>({})
  const [holdingDelta, setHoldingDelta] = useState<Record<string, number>>({})
  const [allLedgerLoading, setAllLedgerLoading] = useState(false)
  const [allLedger, setAllLedger] = useState<{ created_at: string; product_id?: string; delta: number; reason?: string }[]>([])
  const [allLedgerPage, setAllLedgerPage] = useState(1)
  const [allLedgerPageSize, setAllLedgerPageSize] = useState(10)
  const [allLedgerTotal, setAllLedgerTotal] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<{ name?: string }>({})
  // holdings pagination
  const [holdPage, setHoldPage] = useState(1)
  const [holdPageSize, setHoldPageSize] = useState(5)
  const isMobile = useMobile()

  useEffect(() => {
    setForm(item)
    setFeatures(item?.features || '')
    setInitialPoints(0); setPointsDelta(0); setPointsReason(''); setLedger([])
    // preload memo from reservation create (localStorage)
    try {
      if (item?.id) {
        const saved = localStorage.getItem(`memoDraft:${item.id}`) || ''
        if (saved) setNewReason(saved)
      }
    } catch {}
  }, [item])

  useEffect(() => {
    if (!open || !item?.id) return
    const load = async () => {
      try {
        const [holdingsData, productsData, pointsData] = await Promise.all([
          customerProductsApi.list(item.id),
          productsApi.list({ limit: 1000 }),
          pointsApi.getBalance(item.id, { withLedger: false }),
        ])
        const normalized = Array.isArray(holdingsData) ? holdingsData : []
        setHoldings(normalized as Holding[])
        // initialize per-holding delta to 1
        try {
          const init: Record<string, number> = {}
          normalized.forEach((h) => { if (h?.id) init[String(h.id)] = 1 })
          setHoldingDelta(init)
        } catch {}
        setProducts(Array.isArray(productsData) ? productsData : [])
        setPointsBalance(Number(pointsData?.balance || 0))
      } catch { /* noop */ }
    }
    load()
  }, [open, item?.id])

  // 보유 상품 변동 내역: 페이지네이션으로 로드
  useEffect(() => {
    const loadAllHoldingsLedger = async () => {
      if (!open || !form?.id) return
      try {
        setAllLedgerLoading(true)
        const offset = (allLedgerPage - 1) * allLedgerPageSize
        const data = await customerProductsApi.getCustomerLedger(form.id, { 
          limit: allLedgerPageSize + 1, // 다음 페이지 존재 여부 확인을 위해 +1
          offset 
        })
        const arr = Array.isArray(data) ? data : []
        setAllLedgerTotal(arr.length > allLedgerPageSize ? allLedgerPage * allLedgerPageSize + 1 : (allLedgerPage - 1) * allLedgerPageSize + arr.length)
        setAllLedger(arr.slice(0, allLedgerPageSize).map(item => ({
          created_at: item.created_at || '',
          product_id: item.product_id,
          delta: item.delta,
          ...(item.reason && { reason: item.reason }),
        })))
      } catch {
        setAllLedger([])
        setAllLedgerTotal(0)
      } finally {
        setAllLedgerLoading(false)
      }
    }
    loadAllHoldingsLedger()
  }, [open, form?.id, allLedgerPage, allLedgerPageSize])

  // compute date range
  const computedRange = useMemo(() => {
    return { from: '', to: '' }
  }, [])

  // load ledger/report when open or page changes (항상 로드)
  useEffect(() => {
    const run = async () => {
      if (!open || !item?.id) return
      setLoadingHistory(true)
      try {
        // 페이지네이션: pageSize+1 로 로드하여 다음 페이지 존재 여부 확인
        const data = await pointsApi.getBalance(item.id, {
          from: computedRange.from,
          to: computedRange.to,
          withLedger: true,
          limit: pageSize + 1,
          offset: (histPage - 1) * pageSize,
        })
        const arr = Array.isArray(data.ledger) ? data.ledger : []
        setHasNext(arr.length > pageSize)
        setLedger(arr.slice(0, pageSize).map(item => ({
          created_at: item.created_at || '',
          delta: item.delta,
          ...(item.reason && { reason: item.reason }),
        })))
      } catch {
        setLedger([])
        setHasNext(false)
      } finally {
        setLoadingHistory(false)
      }
    }
    run()
  }, [computedRange.from, computedRange.to, open, item?.id, histPage])

  // 포인트 추가 핸들러
  const handleAddPoints = useCallback(async () => {
    if (!form?.id) return
    const amt = Number(pointsDelta || 100)
    if (!amt) return
    try {
      const result = await pointsApi.addLedgerEntry(form.id, {
        delta: Math.abs(amt),
        reason: pointsReason || 'manual-add'
      })
      setPointsBalance(result.balance)
      setPointsDelta(0)
      setPointsReason('')
      toast.success('추가되었습니다.')
    } catch {
      toast.error('포인트 추가 실패')
    }
  }, [form?.id, pointsDelta, pointsReason, toast])

  // 키보드 단축키: Alt+1/2/3 탭 전환, Enter 시 기본 동작(추가)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key === '1') { e.preventDefault(); setActiveTab('overview') }
      if (e.altKey && e.key === '2') { e.preventDefault(); setActiveTab('points') }
      if (e.altKey && e.key === '3') { e.preventDefault(); setActiveTab('holdings') }
      if (e.key === 'Enter' && activeTab === 'points' && pointsDelta) {
        handleAddPoints()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, activeTab, pointsDelta, handleAddPoints])

  const save = async () => {
    try {
      setLoading(true); setError(''); setFieldErrors({})
      if (!form) throw new Error('잘못된 입력입니다.')
      const body: CustomerUpdateInput = { 
        name: (form.name || '').trim(), 
        phone: form.phone || null, 
        email: form.email || null, 
        address: form.address || null,
        health_allergies: form.health_allergies || null,
        health_medications: form.health_medications || null,
        health_skin_conditions: form.health_skin_conditions || null,
        health_pregnant: form.health_pregnant || null,
        health_breastfeeding: form.health_breastfeeding || null,
        health_notes: form.health_notes || null,
        skin_type: form.skin_type || null,
        skin_concerns: form.skin_concerns || null,
        birthdate: form.birthdate || null,
        recommended_visit_interval_days: form.recommended_visit_interval_days || null,
      }
      // features는 값이 있을 때만 포함
      if (features && features.trim() !== '') {
        body.features = features.trim()
      }
      if (!body.name) {
        setFieldErrors(prev => ({ ...prev, name: '이름은 필수입니다.' }))
        throw new Error('이름은 필수입니다.')
      }
      let created: { id: string } | null = null
      if (form.id) {
        await customersApi.update(form.id, body)
      } else {
        created = await customersApi.create(body as CustomerCreateInput)
      }
      // 신규 고객 초기 포인트 반영
      if (!form.id && initialPoints && created?.id) {
        try {
          await pointsApi.addLedgerEntry(created.id, { delta: Number(initialPoints), reason: 'initial' })
        } catch {}
      }
      hapticFeedback('success')
      onSaved(); onClose(); toast.success('고객이 저장되었습니다.')
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '에러가 발생했습니다.'
      setError(errorMessage)
    } finally { setLoading(false) }
  }

  const removeItem = async () => {
    if (!form?.id) return
    if (!confirm('삭제하시겠습니까?')) return
    hapticFeedback('warning')
    try {
      await customersApi.delete(form.id)
      hapticFeedback('success')
      onDeleted(); onClose(); toast.success('삭제되었습니다.')
    } catch {
      toast.error('삭제 실패')
    }
  }

  // 포인트 차감 핸들러
  const handleDeductPoints = async () => {
    if (!form?.id) return
    const amt = Number(pointsDelta || 100)
    if (!amt) return
    try {
      const result = await pointsApi.addLedgerEntry(form.id, {
        delta: -Math.abs(amt),
        reason: pointsReason || 'manual-deduct'
      })
      setPointsBalance(result.balance)
      setPointsDelta(0)
      setPointsReason('')
      toast.success('차감되었습니다.')
    } catch {
      toast.error('포인트 차감 실패')
    }
  }

  // 엑셀 내보내기 핸들러
  const handleExportExcel = () => {
    const header = '<tr><th>created_at</th><th>reason</th><th>delta</th></tr>'
    const body = ledger
      .map(r => {
        const dt = String(r.created_at).replace('T', ' ').slice(0, 19)
        const reason = (r.reason || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        return `<tr><td>${dt}</td><td>${reason}</td><td>${r.delta}</td></tr>`
      })
      .join('')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body><table>${header}${body}</table></body></html>`
    const blob = new Blob([html], {
      type: 'application/vnd.ms-excel'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'points_history.xls'
    a.click()
    URL.revokeObjectURL(url)
  }

  // 보유 상품 추가 핸들러
  const handleAddProduct = async () => {
    if (!newProductId || !form?.id) return
    try {
      const added = await customerProductsApi.create({
        customer_id: form.id,
        product_id: newProductId,
        quantity: newQty,
        reason: (newReason ? `${newReason} (사용자 직접 변경)` : 'add (사용자 직접 변경)')
      })
      setHoldings(h => [...h, added as Holding])
      setNewProductId('')
      setNewQty(1)
      setNewReason('')
    } catch {
      toast.error('추가 실패')
    }
  }

  // 보유 상품 증가 핸들러
  const handleIncreaseHolding = async (holding: Holding) => {
    const cur = holdings.find(x => x.id === holding.id)
    if (!cur) return
    const amt = Math.abs(Number(holdingDelta[holding.id] ?? 1))
    if (!amt) return
    const ok = confirm(`추가 확인\n제품: ${cur.products?.name || ''}\n변경 수량: +${amt}\n메모: ${holdingReason[holding.id] || ''}\n진행할까요?`)
    if (!ok) return
    const nextQty = Number(cur.quantity || 0) + amt
    try {
      await customerProductsApi.update(holding.id, {
        quantity: nextQty,
        reason: `${(holdingReason[holding.id] || 'increase')} (사용자 직접 변경)`
      })
      setHoldings(list => list.map(x => x.id === holding.id ? { ...x, quantity: nextQty } : x))
      setHoldingReason(s => ({ ...s, [holding.id]: '' }))
      setHoldingDelta(s => ({ ...s, [holding.id]: 1 }))
      if (form?.id) {
        try {
          window.dispatchEvent(new CustomEvent('holdings-updated', { detail: { customerId: form.id } }))
        } catch {}
      }
      toast.success('추가되었습니다.')
    } catch {
      toast.error('추가 실패')
    }
  }

  // 보유 상품 감소 핸들러
  const handleDecreaseHolding = async (holding: Holding) => {
    const cur = holdings.find(x => x.id === holding.id)
    if (!cur) return
    const amt = Math.abs(Number(holdingDelta[holding.id] ?? 1))
    if (!amt) return
    const ok = confirm(`차감 확인\n제품: ${cur.products?.name || ''}\n변경 수량: -${amt}\n메모: ${holdingReason[holding.id] || ''}\n진행할까요?`)
    if (!ok) return
    const nextQty = Math.max(0, Number(cur.quantity || 0) - amt)
    try {
      await customerProductsApi.update(holding.id, {
        quantity: nextQty,
        reason: `${(holdingReason[holding.id] || 'decrease')} (사용자 직접 변경)`
      })
      setHoldings(list => list.map(x => x.id === holding.id ? { ...x, quantity: nextQty } : x))
      setHoldingReason(s => ({ ...s, [holding.id]: '' }))
      setHoldingDelta(s => ({ ...s, [holding.id]: 1 }))
      if (form?.id) {
        try {
          window.dispatchEvent(new CustomEvent('holdings-updated', { detail: { customerId: form.id } }))
        } catch {}
      }
      toast.success('차감되었습니다.')
    } catch {
      toast.error('차감 실패')
    }
  }

  // 보유 상품 삭제 핸들러
  const handleDeleteHolding = async (holdingId: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    try {
      await customerProductsApi.delete(holdingId)
      setHoldings(list => list.filter(x => x.id !== holdingId))
      if (form?.id) {
        try {
          window.dispatchEvent(new CustomEvent('holdings-updated', { detail: { customerId: form.id } }))
        } catch {}
      }
    } catch {
      toast.error('삭제 실패')
    }
  }

  if (!open || !form) return null

  const content = (
    <div className="space-y-6">
      {error && <p className="text-sm text-rose-600">{error}</p>}

      {/* 상단 요약 바 */}
      <CustomerSummaryBar
        name={form.name}
        phone={form.phone ?? null}
        email={form.email ?? null}
        pointsBalance={pointsBalance}
        holdingsCount={holdings.length}
      />

      {/* 탭 */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'overview' | 'points' | 'holdings' | 'treatments' | 'programs')} className="mt-6">
        <TabsList className="mb-6 border-b-2 border-neutral-400">
          <TabsTrigger value="overview">
            기본 정보
          </TabsTrigger>
          <TabsTrigger value="points">
            포인트
          </TabsTrigger>
          <TabsTrigger value="holdings">
            보유 상품
          </TabsTrigger>
          <TabsTrigger value="treatments">
            시술 히스토리
          </TabsTrigger>
          <TabsTrigger value="programs">
            시술 프로그램
          </TabsTrigger>
        </TabsList>

        {/* 기본 정보 탭 */}
        <TabsContent value="overview">
          <CustomerOverviewTab
            form={form ? {
              id: form.id,
              name: form.name,
              phone: form.phone ?? null,
              email: form.email ?? null,
              address: form.address ?? null,
              health_allergies: form.health_allergies ?? null,
              health_medications: form.health_medications ?? null,
              health_skin_conditions: form.health_skin_conditions ?? null,
              health_pregnant: form.health_pregnant ?? null,
              health_breastfeeding: form.health_breastfeeding ?? null,
              health_notes: form.health_notes ?? null,
              skin_type: form.skin_type ?? null,
              skin_concerns: form.skin_concerns ?? null,
            } : null}
            features={features}
            initialPoints={initialPoints}
            fieldErrors={fieldErrors}
            onChangeForm={(updater) => {
              setForm(f => {
                if (!f) return null
                const result = updater({
                  id: f.id,
                  name: f.name,
                  phone: f.phone ?? null,
                  email: f.email ?? null,
                  address: f.address ?? null,
                  health_allergies: f.health_allergies ?? null,
                  health_medications: f.health_medications ?? null,
                  health_skin_conditions: f.health_skin_conditions ?? null,
                  health_pregnant: f.health_pregnant ?? null,
                  health_breastfeeding: f.health_breastfeeding ?? null,
                  health_notes: f.health_notes ?? null,
                  skin_type: f.skin_type ?? null,
                  skin_concerns: f.skin_concerns ?? null,
                })
                if (!result) return null
                return {
                  ...f,
                  ...result,
                } as Customer
              })
            }}
            onChangeFeatures={setFeatures}
            onChangeInitialPoints={setInitialPoints}
          />
        </TabsContent>

        {/* 포인트 탭 */}
        <TabsContent value="points">
          {form.id && (
            <CustomerPointsTab
              customerId={form.id}
              pointsBalance={pointsBalance}
              pointsDelta={pointsDelta}
              pointsReason={pointsReason}
              ledger={ledger}
              loadingHistory={loadingHistory}
              histPage={histPage}
              hasNext={hasNext}
              onChangeDelta={setPointsDelta}
              onChangeReason={setPointsReason}
              onAddPoints={handleAddPoints}
              onDeductPoints={handleDeductPoints}
              onChangePage={setHistPage}
              onExportExcel={handleExportExcel}
            />
          )}
        </TabsContent>

        {/* 보유 상품 탭 */}
        <TabsContent value="holdings">
          {form.id && (
            <CustomerHoldingsTab
              customerId={form.id}
              holdings={holdings.filter(h => h.products).map(h => ({
                id: h.id,
                product_id: h.product_id,
                quantity: h.quantity || 0,
                ...(h.notes && { notes: h.notes }),
                products: h.products!,
              }))}
              products={products.map(p => ({
                id: String(p.id),
                name: p.name,
              }))}
              holdingDelta={holdingDelta}
              holdingReason={holdingReason}
              newProductId={newProductId}
              newQty={newQty}
              newReason={newReason}
              allLedger={allLedger}
              allLedgerLoading={allLedgerLoading}
              allLedgerPage={allLedgerPage}
              allLedgerPageSize={allLedgerPageSize}
              allLedgerTotal={allLedgerTotal}
              holdPage={holdPage}
              holdPageSize={holdPageSize}
              onAddProduct={handleAddProduct}
              onChangeNewProduct={setNewProductId}
              onChangeNewQty={setNewQty}
              onChangeNewReason={setNewReason}
              onChangeHoldingDelta={(holdingId, value) => setHoldingDelta(s => ({ ...s, [holdingId]: value }))}
              onChangeHoldingReason={(holdingId, value) => setHoldingReason(s => ({ ...s, [holdingId]: value }))}
              onIncrease={async (holding) => {
                const h = holdings.find(x => x.id === holding.id)
                if (h) await handleIncreaseHolding(h)
              }}
              onDecrease={async (holding) => {
                const h = holdings.find(x => x.id === holding.id)
                if (h) await handleDecreaseHolding(h)
              }}
              onDelete={handleDeleteHolding}
              onChangeHoldPage={setHoldPage}
              onChangeHoldPageSize={setHoldPageSize}
              onChangeAllLedgerPage={setAllLedgerPage}
              onChangeAllLedgerPageSize={setAllLedgerPageSize}
            />
          )}
        </TabsContent>

        {/* 시술 히스토리 탭 */}
        <TabsContent value="treatments">
          {form.id && (
            <CustomerTreatmentHistoryTab customerId={form.id} />
          )}
        </TabsContent>

        {/* 시술 프로그램 탭 */}
        <TabsContent value="programs">
          {form.id && (
            <CustomerProgramsTab customerId={form.id} />
          )}
        </TabsContent>
      </Tabs>

      {/* 하단 버튼 (모바일용) */}
      <div className="md:hidden flex gap-2 pt-4 pb-2 border-t border-neutral-200 sticky bottom-0 bg-white">
        <Button variant="secondary" onClick={onClose} disabled={loading} className="flex-1">취소</Button>
        {form.id && (
          <Button variant="danger" onClick={removeItem} disabled={loading} className="flex-1">삭제</Button>
        )}
        <Button variant="primary" onClick={save} disabled={loading} loading={loading} className="flex-1">저장</Button>
      </div>
    </div>
  )

  // 모바일에서는 BottomSheet, 데스크톱에서는 Modal
  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title={form?.id ? '고객 정보 수정' : '새 고객 추가'}
        description="고객의 기본 정보, 포인트, 보유 상품을 한눈에 관리합니다."
        maxHeight={90}
        swipeToClose
      >
        {content}
      </BottomSheet>
    )
  }

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader
        title="고객 상세"
        description="고객의 기본 정보, 포인트, 보유 상품을 한눈에 관리합니다."
      />
      <ModalBody>
        {content}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading} className="w-full md:w-auto">취소</Button>
        <Button variant="danger" onClick={removeItem} disabled={loading} className="w-full md:w-auto">삭제</Button>
        <Button variant="primary" onClick={save} disabled={loading} loading={loading} className="w-full md:w-auto">저장</Button>
      </ModalFooter>
    </Modal>
  )
}


