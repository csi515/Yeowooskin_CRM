'use client'

import { useEffect, useState } from 'react'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/app/components/ui/Modal'
import Button from '@/app/components/ui/Button'
import Textarea from '@/app/components/ui/Textarea'
import { useAppToast } from '@/app/lib/ui/toast'
import { staffApi } from '@/app/lib/api/staff'
import { settingsApi } from '@/app/lib/api/settings'

type Staff = { id?: string; name: string; phone?: string; email?: string; role?: string; notes?: string; active?: boolean }

export default function StaffDetailModal({ open, onClose, item, onSaved, onDeleted }: { open: boolean; onClose: () => void; item: Staff | null; onSaved: () => void; onDeleted: () => void }) {
  const [form, setForm] = useState<Staff>({ name: '', phone: '', email: '', role: '', notes: '', active: true })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [positions, setPositions] = useState<string[]>([])
  const toast = useAppToast()

  // 설정에서 직책 목록 불러오기
  useEffect(() => {
    const loadPositions = async () => {
      try {
        const settings = await settingsApi.get()
        setPositions(settings.staffSettings?.positions || [])
      } catch (error) {
        console.error('직책 목록 로드 실패:', error)
        setPositions([])
      }
    }
    loadPositions()
  }, [])

  useEffect(() => {
    setForm(item || { name: '', phone: '', email: '', role: '', notes: '', active: true })
  }, [item])

  const save = async () => {
    try {
      setLoading(true); setError('')
      const body: { name: string; phone: string | null; email: string | null; role: string | null; active: boolean; notes?: string } = {
        name: (form.name || '').trim(),
        phone: form.phone?.trim() ? form.phone.trim() : null,
        email: form.email?.trim() ? form.email.trim() : null,
        role: form.role?.trim() ? form.role.trim() : null,
        active: form.active !== false
      }
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
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '에러가 발생했습니다.'
      setError(errorMessage)
      toast.error('저장 실패', errorMessage)
    } finally {
      setLoading(false)
    }
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
        <div className="space-y-3">
          {error && (
            <div className="p-2 rounded-md bg-rose-50 border border-rose-200" role="alert">
              <p className="text-xs text-rose-600">{error}</p>
            </div>
          )}

          {/* 기본정보 섹션 */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-neutral-900">기본정보</h3>
            <div className="space-y-2">
              <div>
                <label htmlFor="staff-name" className="block text-xs font-medium text-neutral-700 mb-0.5">
                  이름 <span className="text-rose-600">*</span>
                </label>
                <input
                  id="staff-name"
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 h-9 w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="staff-id" className="block text-xs font-medium text-neutral-700 mb-0.5">
                  직원ID
                </label>
                <input
                  id="staff-id"
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 h-9 w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all bg-neutral-50"
                  value={form.id || ''}
                  disabled
                  readOnly
                />
              </div>
              <div>
                <label htmlFor="staff-role" className="block text-xs font-medium text-neutral-700 mb-0.5">
                  직책
                </label>
                <select
                  id="staff-role"
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 h-9 w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all bg-white"
                  value={form.role || ''}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                >
                  <option value="">선택</option>
                  {positions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 연락처 섹션 */}
          <div className="space-y-2 pt-2 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-neutral-900">연락처</h3>
            <div className="space-y-2">
              <div>
                <label htmlFor="staff-email" className="block text-xs font-medium text-neutral-700 mb-0.5">
                  이메일(선택)
                </label>
                <input
                  id="staff-email"
                  type="email"
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 h-9 w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
                  value={form.email || ''}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="예: staff@example.com"
                />
              </div>
              <div>
                <label htmlFor="staff-phone" className="block text-xs font-medium text-neutral-700 mb-0.5">
                  휴대폰(선택)
                </label>
                <input
                  id="staff-phone"
                  type="tel"
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 h-9 w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
                  value={form.phone || ''}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="예: 010-1234-5678"
                />
              </div>
            </div>
          </div>

          {/* 권한/소속 섹션 */}
          <div className="space-y-2 pt-2 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-neutral-900">권한/소속</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <label htmlFor="staff-active" className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700 cursor-pointer">
                  <input
                    id="staff-active"
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-200"
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
