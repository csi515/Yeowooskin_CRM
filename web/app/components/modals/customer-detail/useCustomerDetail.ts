import { useState, useEffect, useCallback, useRef } from 'react'
import { customerProductsApi } from '@/app/lib/api/customer-products'
import { productsApi } from '@/app/lib/api/products'
import { pointsApi } from '@/app/lib/api/points'
import { customersApi } from '@/app/lib/api/customers'
import { useAppToast } from '@/app/lib/ui/toast'
import { getLocalizedErrorMessage } from '@/app/lib/utils/messages'
import type { CustomerProduct } from '@/app/lib/repositories/customer-products.repository'
import type { Customer } from '@/types/entities'

export type Holding = CustomerProduct

export function useCustomerDetail(
  item: Customer | null,
  open: boolean,
  onSaved: () => void,
  onDeleted: () => void,
  onClose: () => void
) {
  const [form, setForm] = useState<Customer | null>(item)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useAppToast()
  const [features, setFeatures] = useState<string>('')
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; email?: string }>({})

  // 포인트 상태
  const [pointsBalance, setPointsBalance] = useState<number>(0)
  const [pointsDelta, setPointsDelta] = useState<number>(0)
  const [pointsReason, setPointsReason] = useState<string>('')
  const [pointsLedger, setPointsLedger] = useState<{ created_at: string; delta: number; reason?: string }[]>([])

  // 보유상품 상태
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [products, setProducts] = useState<{ id: string; name: string }[]>([])
  const [newProductId, setNewProductId] = useState<string>('')
  const [newQty, setNewQty] = useState<number>(1)
  const [newReason, setNewReason] = useState<string>('')
  const [addingProduct, setAddingProduct] = useState(false)
  const [holdingDelta, setHoldingDelta] = useState<Record<string, number>>({})
  const [holdingReason, setHoldingReason] = useState<Record<string, string>>({})
  const [productLedger, setProductLedger] = useState<{ created_at: string; delta: number; reason?: string | null | undefined; product_id: string }[]>([])

  // 자동 저장
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (item) {
      setForm(item)
      setFeatures(item.features || '')
      setError('')
      setFieldErrors({})
    }
  }, [item])

  // 데이터 로드
  useEffect(() => {
    if (!open || !form?.id) return

    const loadData = async () => {
      try {
        const [holdingsData, productsData, pointsData, pointsLedgerData, productLedgerData] = await Promise.all([
          customerProductsApi.list(form.id),
          productsApi.list({ limit: 1000 }),
          pointsApi.getBalance(form.id, { withLedger: false }),
          pointsApi.getLedger(form.id, { limit: 100 }),
          customerProductsApi.getCustomerLedger(form.id, { limit: 100, offset: 0 })
        ])

        setHoldings(Array.isArray(holdingsData) ? holdingsData as Holding[] : [])
        setProducts(Array.isArray(productsData) ? productsData.map(p => ({ id: String(p.id), name: p.name })) : [])
        setPointsBalance(Number(pointsData?.balance || 0))
        setPointsLedger(Array.isArray(pointsLedgerData) ? pointsLedgerData : [])
        setProductLedger(Array.isArray(productLedgerData) ? productLedgerData.map(item => ({
          created_at: item.created_at || '',
          delta: item.delta || 0,
          reason: item.reason ?? null,
          product_id: item.product_id || ''
        })) : [])

        const init: Record<string, number> = {}
        if (Array.isArray(holdingsData)) {
          holdingsData.forEach((h: any) => {
            if (h?.id) init[String(h.id)] = 1
          })
        }
        setHoldingDelta(init)
      } catch (err) {
        console.error('Failed to load data:', err)
      }
    }

    loadData()
  }, [open, form?.id])

  // 자동 저장 함수
  const autoSave = useCallback(async () => {
    if (!form?.id) return

    try {
      const body: { name: string; phone?: string | null; email?: string | null; address?: string | null; features?: string } = {
        name: (form.name || '').trim(),
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null
      }

      if (features && features.trim() !== '') {
        body.features = features.trim()
      }

      // 검증
      const errors: { phone?: string; email?: string } = {}

      if (!body.name) return

      if (!body.phone || !body.phone.trim()) return

      const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/
      if (!phoneRegex.test(body.phone.trim())) {
        errors.phone = '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'
      }

      if (body.email && body.email.trim()) {
        const emailRegex = /.+@.+\..+/
        if (!emailRegex.test(body.email.trim())) {
          errors.email = '올바른 이메일 형식이 아닙니다 (예: example@email.com)'
        }
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        return
      }

      await customersApi.update(form.id, body)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '저장에 실패했습니다.'
      toast.error(errorMessage)
    }
  }, [form, features, toast])

  // 자동 저장 트리거
  useEffect(() => {
    if (!form?.id) return

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave()
    }, 1000)

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [form, features, autoSave])

  // 신규 고객 생성
  const createAndClose = async () => {
    if (form?.id) return

    try {
      setLoading(true)
      setError('')
      setFieldErrors({})

      if (!form) throw new Error('잘못된 입력입니다.')

      const body: { name: string; phone?: string | null; email?: string | null; address?: string | null; features?: string } = {
        name: (form.name || '').trim(),
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null
      }

      if (features && features.trim() !== '') {
        body.features = features.trim()
      }

      // 검증
      const errors: { phone?: string; email?: string } = {}

      if (!body.name) {
        throw new Error('이름은 필수입니다.')
      }

      if (!body.phone || !body.phone.trim()) {
        throw new Error('전화번호는 필수입니다.')
      }

      const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/
      if (!phoneRegex.test(body.phone.trim())) {
        throw new Error('올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)')
      }

      if (body.email && body.email.trim()) {
        const emailRegex = /.+@.+\..+/
        if (!emailRegex.test(body.email.trim())) {
          errors.email = '올바른 이메일 형식이 아닙니다 (예: example@email.com)'
        }
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        throw new Error(Object.values(errors)[0])
      }

      await customersApi.create(body)

      onSaved()
      onClose()
      toast.success('고객이 생성되었습니다.')
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '에러가 발생했습니다.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 포인트 추가
  const handleAddPoints = async () => {
    if (!form?.id || !pointsDelta) return
    try {
      await pointsApi.addLedgerEntry(form.id, { delta: Math.abs(pointsDelta), reason: pointsReason || '-' })
      setPointsBalance(prev => prev + Math.abs(pointsDelta))
      setPointsDelta(0)
      setPointsReason('')

      const ledgerData = await pointsApi.getLedger(form.id, { limit: 100 })
      setPointsLedger(Array.isArray(ledgerData) ? ledgerData : [])

      toast.success('포인트가 추가되었습니다.')
    } catch (error) {
      const message = getLocalizedErrorMessage(error, '포인트 추가에 실패했습니다.')
      toast.error(message)
    }
  }

  // 포인트 차감
  const handleDeductPoints = async () => {
    if (!form?.id || !pointsDelta) return
    try {
      await pointsApi.addLedgerEntry(form.id, { delta: -Math.abs(pointsDelta), reason: pointsReason || '-' })
      setPointsBalance(prev => prev - Math.abs(pointsDelta))
      setPointsDelta(0)
      setPointsReason('')

      const ledgerData = await pointsApi.getLedger(form.id, { limit: 100 })
      setPointsLedger(Array.isArray(ledgerData) ? ledgerData : [])

      toast.success('포인트가 차감되었습니다.')
    } catch (error) {
      const message = getLocalizedErrorMessage(error, '포인트 차감에 실패했습니다.')
      toast.error(message)
    }
  }

  // 보유 상품 추가
  const handleAddProduct = async () => {
    if (!newProductId || !form?.id) return
    setAddingProduct(true)
    try {
      await customerProductsApi.create({
        customer_id: form.id,
        product_id: newProductId,
        quantity: newQty,
        reason: newReason || '-'
      })

      const holdingsData = await customerProductsApi.list(form.id)
      setHoldings(Array.isArray(holdingsData) ? holdingsData as Holding[] : [])

      const ledgerData = await customerProductsApi.getCustomerLedger(form.id, { limit: 100, offset: 0 })
      setProductLedger(Array.isArray(ledgerData) ? ledgerData.map(item => ({
        created_at: item.created_at || '',
        delta: item.delta || 0,
        reason: item.reason ?? null,
        product_id: item.product_id || ''
      })) : [])

      setNewProductId('')
      setNewQty(1)
      setNewReason('')
      toast.success('상품이 추가되었습니다.')
    } catch (error) {
      const message = getLocalizedErrorMessage(error, '상품 추가에 실패했습니다.')
      toast.error(message)
    } finally {
      setAddingProduct(false)
    }
  }

  // 보유 상품 증가
  const handleIncreaseHolding = async (holding: Holding) => {
    const amt = Math.abs(Number(holdingDelta[holding.id] ?? 1))
    if (!amt) return

    const nextQty = Number(holding.quantity || 0) + amt
    const prevQty = holding.quantity

    setHoldings(list => list.map(x => x.id === holding.id ? { ...x, quantity: nextQty } : x))

    try {
      await customerProductsApi.update(holding.id, {
        quantity: nextQty,
        reason: holdingReason[holding.id] || '-'
      })

      setHoldingReason(s => ({ ...s, [holding.id]: '' }))
      setHoldingDelta(s => ({ ...s, [holding.id]: 1 }))

      if (form?.id) {
        const ledgerData = await customerProductsApi.getCustomerLedger(form.id, { limit: 100, offset: 0 })
        setProductLedger(Array.isArray(ledgerData) ? ledgerData.map(item => ({
          created_at: item.created_at || '',
          delta: item.delta || 0,
          reason: item.reason ?? null,
          product_id: item.product_id || ''
        })) : [])
      }

      toast.success(`+${amt} 추가되었습니다.`)
    } catch (error) {
      setHoldings(list => list.map(x => x.id === holding.id ? { ...x, quantity: prevQty } : x))
      const message = getLocalizedErrorMessage(error, '수량 증가에 실패했습니다.')
      toast.error(message)
    }
  }

  // 보유 상품 감소
  const handleDecreaseHolding = async (holding: Holding) => {
    const amt = Math.abs(Number(holdingDelta[holding.id] ?? 1))
    if (!amt) return

    const nextQty = Math.max(0, Number(holding.quantity || 0) - amt)
    const prevQty = holding.quantity

    setHoldings(list => list.map(x => x.id === holding.id ? { ...x, quantity: nextQty } : x))

    try {
      await customerProductsApi.update(holding.id, {
        quantity: nextQty,
        reason: holdingReason[holding.id] || '-'
      })

      setHoldingReason(s => ({ ...s, [holding.id]: '' }))
      setHoldingDelta(s => ({ ...s, [holding.id]: 1 }))

      if (form?.id) {
        const ledgerData = await customerProductsApi.getCustomerLedger(form.id, { limit: 100, offset: 0 })
        setProductLedger(Array.isArray(ledgerData) ? ledgerData.map(item => ({
          created_at: item.created_at || '',
          delta: item.delta || 0,
          reason: item.reason ?? null,
          product_id: item.product_id || ''
        })) : [])
      }

      toast.success(`-${amt} 차감되었습니다.`)
    } catch (error) {
      setHoldings(list => list.map(x => x.id === holding.id ? { ...x, quantity: prevQty } : x))
      const message = getLocalizedErrorMessage(error, '수량 차감에 실패했습니다.')
      toast.error(message)
    }
  }

  // 보유 상품 삭제
  const handleDeleteHolding = async (holdingId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      await customerProductsApi.delete(holdingId)
      setHoldings(list => list.filter(x => x.id !== holdingId))
      toast.success('삭제되었습니다.')
    } catch (error) {
      const message = getLocalizedErrorMessage(error, '삭제에 실패했습니다.')
      toast.error(message)
    }
  }

  // 고객 삭제
  const removeItem = async () => {
    if (!form?.id) return
    if (!confirm('삭제하시겠습니까?')) return

    try {
      await customersApi.delete(form.id)
      onDeleted()
      onClose()
      toast.success('고객이 삭제되었습니다.')
    } catch (error) {
      const message = getLocalizedErrorMessage(error, '삭제에 실패했습니다.')
      toast.error(message)
    }
  }

  return {
    form, setForm,
    loading,
    error,
    features, setFeatures,
    fieldErrors,
    pointsBalance,
    pointsDelta, setPointsDelta,
    pointsReason, setPointsReason,
    pointsLedger,
    holdings,
    products,
    newProductId, setNewProductId,
    newQty, setNewQty,
    newReason, setNewReason,
    addingProduct,
    holdingDelta, setHoldingDelta,
    holdingReason, setHoldingReason,
    productLedger,
    createAndClose,
    handleAddPoints,
    handleDeductPoints,
    handleAddProduct,
    handleIncreaseHolding,
    handleDecreaseHolding,
    handleDeleteHolding,
    removeItem
  }
}
