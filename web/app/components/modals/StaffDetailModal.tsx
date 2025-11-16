'use client'

import { useEffect, useState } from 'react'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../ui/Modal'
import Button from '../ui/Button'
import Textarea from '../ui/Textarea'
import { useAppToast } from '@/app/lib/ui/toast'
import { staffApi } from '@/app/lib/api/staff'

type Staff = { id?: string; name: string; phone?: string; email?: string; role?: string; notes?: string; active?: boolean }

export default function StaffDetailModal({ open, onClose, item, onSaved, onDeleted }: { open: boolean; onClose: () => void; item: Staff | null; onSaved: () => void; onDeleted: () => void }) {
  const [form, setForm] = useState<Staff>({ name: '', phone: '', email: '', role: '', notes: '', active: true })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useAppToast()

  useEffect(() => {
    setForm(item || { name: '', phone: '', email: '', role: '', notes: '', active: true })
  }, [item])

  const save = async () => {
    try {
      setLoading(true); setError('')
      const body: any = { name: (form.name||'').trim(), phone: form.phone || null, email: form.email || null, role: form.role || null, active: form.active !== false }
      // notes는 값이 있을 때만 포함
      if (form.notes && form.notes.trim() !== '') {
        body.notes = form.notes.trim()
      }
      if (!body.name) throw new Error('이름은 필수입니다.')
      if (form.id) {
        await staffApi.update(form.id, body)
      } else {
        await staffApi.create(body)
      }
      onSaved(); onClose(); toast.success('직원이 저장되었습니다.')
    } catch (e:any) { setError(e?.message || '에러가 발생했습니다.'); toast.error('저장 실패', e?.message) } finally { setLoading(false) }
  }

  const removeItem = async () => {
    if (!form?.id) return
    if (!confirm('삭제하시겠습니까?')) return
    try {
      await staffApi.delete(form.id)
      onDeleted(); onClose(); toast.success('삭제되었습니다.')
    } catch {
      toast.error('삭제 실패')
    }
  }

  if (!open) return null
  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader title="직원 상세" description="직원 정보를 관리합니다. 이름은 필수입니다." />
      <ModalBody>
        <div className="space-y-6">
          {error && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200" role="alert">
              <p className="text-sm text-rose-600">{error}</p>
            </div>
          )}
          
          {/* 기본정보 섹션 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900">기본정보</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="staff-name" className="block text-sm font-medium text-neutral-700 mb-2">
                  이름 <span className="text-rose-600">*</span>
                </label>
                <input
                  id="staff-name"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full text-base focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="staff-id" className="block text-sm font-medium text-neutral-700 mb-2">
                  직원ID
                </label>
                <input
                  id="staff-id"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full text-base focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
                  value={form.id || ''}
                  disabled
                  readOnly
                />
              </div>
              <div>
                <label htmlFor="staff-role" className="block text-sm font-medium text-neutral-700 mb-2">
                  직책
                </label>
                <select
                  id="staff-role"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full text-base focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all bg-white"
                  value={form.role || ''}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                >
                  <option value="">선택</option>
                  <option value="admin">관리자</option>
                  <option value="manager">매니저</option>
                  <option value="therapist">테라피스트</option>
                  <option value="reception">접수원</option>
                </select>
              </div>
            </div>
          </div>

          {/* 연락처 섹션 */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-neutral-900">연락처</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="staff-email" className="block text-sm font-medium text-neutral-700 mb-2">
                  이메일(선택)
                </label>
                <input
                  id="staff-email"
                  type="email"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full text-base focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
                  value={form.email || ''}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="예: staff@example.com"
                />
              </div>
              <div>
                <label htmlFor="staff-phone" className="block text-sm font-medium text-neutral-700 mb-2">
                  휴대폰(선택)
                </label>
                <input
                  id="staff-phone"
                  type="tel"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full text-base focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
                  value={form.phone || ''}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="예: 010-1234-5678"
                />
              </div>
            </div>
          </div>

          {/* 권한/소속 섹션 */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-neutral-900">권한/소속</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <label htmlFor="staff-active" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 cursor-pointer">
                  <input
                    id="staff-active"
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-200"
                    checked={form.active !== false}
                    onChange={e => setForm({ ...form, active: e.target.checked })}
                  />
                  <span>활성</span>
                </label>
              </div>
              <div>
                <Textarea
                  label="메모(선택)"
                  value={form.notes || ''}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="추가 메모를 입력하세요"
                />
              </div>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading} className="w-full md:w-auto">취소</Button>
        {form.id && <Button variant="danger" onClick={removeItem} disabled={loading} className="w-full md:w-auto">삭제</Button>}
        <Button variant="primary" onClick={save} disabled={loading} className="w-full md:w-auto">저장</Button>
      </ModalFooter>
    </Modal>
  )
}


