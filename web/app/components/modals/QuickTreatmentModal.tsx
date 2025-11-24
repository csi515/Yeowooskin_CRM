'use client'

import { useState, useEffect } from 'react'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../ui/Modal'
import Button from '../ui/Button'
import { useAppToast } from '@/app/lib/ui/toast'
import { treatmentRecordsApi } from '@/app/lib/api/treatment-records'
import { customersApi } from '@/app/lib/api/customers'
import { useDebounce } from '@/app/lib/hooks/useDebounce'
import { hapticFeedback } from '@/app/lib/utils/haptic'
import type { TreatmentRecordCreateInput, Customer } from '@/types/entities'
import { Search, X } from 'lucide-react'

export default function QuickTreatmentModal() {
  const [open, setOpen] = useState(false)
  const [customerQuery, setCustomerQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [treatmentName, setTreatmentName] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const toast = useAppToast()
  const debouncedQuery = useDebounce(customerQuery, 300)

  // 모달 열기 이벤트 리스너
  useEffect(() => {
    const handleOpen = () => {
      setOpen(true)
      setCustomerQuery('')
      setSelectedCustomer(null)
      setTreatmentName('')
      setShowSuggestions(false)
    }
    window.addEventListener('open-quick-treatment-modal', handleOpen)
    return () => window.removeEventListener('open-quick-treatment-modal', handleOpen)
  }, [])

  // 고객 검색
  useEffect(() => {
    if (!open || !debouncedQuery || debouncedQuery.length < 2) {
      setCustomers([])
      return
    }

    const searchCustomers = async () => {
      try {
        const data = await customersApi.list({ search: debouncedQuery, limit: 5 })
        setCustomers(data)
        setShowSuggestions(true)
      } catch (err) {
        console.error('고객 검색 실패:', err)
        setCustomers([])
      }
    }

    searchCustomers()
  }, [open, debouncedQuery])

  // 시술명 템플릿
  const treatmentTemplates = [
    '기미 관리',
    '여드름 관리',
    '주름 관리',
    '모공 관리',
    '색소 침착 관리',
    '피부 진정',
    '보습 관리',
    '리프팅',
  ]

  const handleSave = async () => {
    if (!selectedCustomer) {
      toast.error('고객을 선택해주세요')
      return
    }
    if (!treatmentName.trim()) {
      toast.error('시술명을 입력해주세요')
      return
    }

    try {
      setLoading(true)
      const input: TreatmentRecordCreateInput = {
        customer_id: selectedCustomer.id,
        treatment_name: treatmentName.trim(),
        treatment_date: new Date().toISOString(),
      }

      await treatmentRecordsApi.create(input)
      hapticFeedback('success')
      toast.success('시술 기록이 저장되었습니다')
      setOpen(false)
      setCustomerQuery('')
      setSelectedCustomer(null)
      setTreatmentName('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '시술 기록 저장 실패'
      toast.error('저장 실패', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerQuery(customer.name || '')
    setShowSuggestions(false)
  }

  return (
    <Modal open={open} onClose={() => setOpen(false)} size="md">
      <ModalHeader title="빠른 시술 기록" description="최소한의 정보로 시술 기록을 빠르게 입력합니다." />
      <ModalBody>
        <div className="space-y-4">
          {/* 고객 검색 */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">고객 *</label>
            <div className="relative">
              <input
                type="text"
                value={customerQuery}
                onChange={(e) => {
                  setCustomerQuery(e.target.value)
                  setShowSuggestions(true)
                  if (!e.target.value) {
                    setSelectedCustomer(null)
                  }
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="고객 이름 또는 전화번호로 검색"
                className="w-full px-3 py-2 pl-10 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                autoFocus
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              {selectedCustomer && (
                <button
                  onClick={() => {
                    setSelectedCustomer(null)
                    setCustomerQuery('')
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 rounded"
                >
                  <X className="h-4 w-4 text-neutral-400" />
                </button>
              )}

              {/* 검색 결과 */}
              {showSuggestions && customers.length > 0 && !selectedCustomer && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                  {customers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full text-left px-4 py-2 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="font-medium text-sm text-neutral-900">{customer.name}</div>
                      {(customer.phone || customer.email) && (
                        <div className="text-xs text-neutral-500">
                          {customer.phone || customer.email}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 시술명 */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">시술명 *</label>
            <div className="space-y-2">
              <input
                type="text"
                value={treatmentName}
                onChange={(e) => setTreatmentName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && selectedCustomer && treatmentName.trim()) {
                    handleSave()
                  }
                }}
                placeholder="시술명을 입력하세요"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                list="treatment-templates"
              />
              <datalist id="treatment-templates">
                {treatmentTemplates.map((template) => (
                  <option key={template} value={template} />
                ))}
              </datalist>
              <div className="flex flex-wrap gap-2">
                {treatmentTemplates.slice(0, 4).map((template) => (
                  <button
                    key={template}
                    onClick={() => setTreatmentName(template)}
                    className="px-3 py-1 text-xs bg-neutral-100 hover:bg-neutral-200 rounded-full transition-colors"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
          취소
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={loading} loading={loading}>
          저장
        </Button>
      </ModalFooter>
    </Modal>
  )
}

