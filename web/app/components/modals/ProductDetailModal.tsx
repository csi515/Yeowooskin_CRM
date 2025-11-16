'use client'

import { useEffect, useState } from 'react'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../ui/Modal'
import Button from '../ui/Button'
import Textarea from '../ui/Textarea'
import { useAppToast } from '@/app/lib/ui/toast'
import { productsApi } from '@/app/lib/api/products'

type Product = { id: string | number; name: string; price?: number | string; description?: string; active?: boolean }

export default function ProductDetailModal({ open, onClose, item, onSaved, onDeleted }: { open: boolean; onClose: () => void; item: Product | null; onSaved: () => void; onDeleted: () => void }) {
  const [form, setForm] = useState<Product | null>(item)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useAppToast()

  useEffect(() => { setForm(item) }, [item])

  const save = async () => {
    if (!form?.id) return
    try {
      setLoading(true); setError('')
      const priceValue = form.price === '' || form.price === null || form.price === undefined ? null : Number(form.price)
      if (priceValue === null) {
        setError('가격은 필수입니다.')
        setLoading(false)
        return
      }
      const body: any = { name: form.name, price: priceValue, active: form.active !== false }
      // description은 값이 있을 때만 포함
      if (form.description && form.description.trim() !== '') {
        body.description = form.description.trim()
      }
      await productsApi.update(String(form.id), body)
      onSaved(); onClose(); toast.success('제품이 저장되었습니다.')
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '에러가 발생했습니다.'
      setError(errorMessage)
      toast.error('저장 실패', errorMessage)
    } finally { setLoading(false) }
  }
  const removeItem = async () => {
    if (!form?.id) return
    if (!confirm('정말 삭제하시겠어요? 이 작업은 되돌릴 수 없습니다.')) return
    try {
      await productsApi.delete(String(form.id))
      onDeleted(); onClose(); toast.success('삭제되었습니다.')
    } catch {
      toast.error('삭제 실패')
    }
  }

  if (!open || !form) return null
  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader title="제품 상세" description="제품의 기본 정보를 수정합니다. 이름과 가격은 필수입니다." />
      <ModalBody>
        <div className="grid gap-4 md:grid-cols-[280px,1fr]">
          <div className="space-y-3">
            {error && <p className="text-sm text-rose-600">{error}</p>}
          </div>
          <div className="space-y-3">
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="block text-sm text-neutral-700 mb-1">이름 <span className="text-rose-600">*</span></label>
                  <input
                    className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 placeholder:text-neutral-400"
                    placeholder="예) 로션 기획세트"
                    value={form.name}
                    onChange={e => setForm(f => f && ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-700 mb-1">가격 <span className="text-rose-600">*</span></label>
                  <input
                    className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 text-right placeholder:text-neutral-400"
                    type="number"
                    placeholder="예: 12,000"
                    value={form.price === null || form.price === undefined || form.price === '' ? '' : form.price}
                    onChange={e => {
                      const val = e.target.value
                      setForm(f => f && ({ ...f, price: val === '' ? '' : (isNaN(Number(val)) ? '' : Number(val)) }))
                    }}
                  />
                </div>
              </div>
              <div>
                <Textarea
                  label="설명(선택)"
                  placeholder="간단한 특징, 용량, 구성 등을 입력하세요"
                  value={form.description || ''}
                  onChange={e => setForm(f => f && ({ ...f, description: e.target.value }))}
                />
                <p className="mt-1 text-xs text-neutral-500">부가세 포함 여부는 별도 표시 기준을 따릅니다.</p>
              </div>
              <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-white">
                <div className="text-sm text-neutral-700 mb-2">이미지 업로드(선택)</div>
                <div className="text-xs text-neutral-500">이미지 업로드 영역(향후 구현 가능)</div>
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.active !== false} onChange={e => setForm(f => f && ({ ...f, active: e.target.checked }))} />
                <span>활성</span>
              </label>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading} className="w-full md:w-auto">취소</Button>
        <Button variant="danger" onClick={removeItem} disabled={loading} className="w-full md:w-auto">삭제</Button>
        <Button variant="primary" onClick={save} disabled={loading} className="w-full md:w-auto">저장</Button>
      </ModalFooter>
    </Modal>
  )
}


