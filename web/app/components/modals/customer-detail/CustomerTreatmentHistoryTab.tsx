'use client'

import { useEffect, useState } from 'react'
import { Calendar, Clock, User, FileText, Image as ImageIcon, Plus, Pencil, Trash2 } from 'lucide-react'
import Button from '../../ui/Button'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../../ui/Modal'
import { useAppToast } from '@/app/lib/ui/toast'
import { treatmentRecordsApi } from '@/app/lib/api/treatment-records'
import { hapticFeedback } from '@/app/lib/utils/haptic'
import type { TreatmentRecord, TreatmentRecordCreateInput } from '@/types/entities'
import { Skeleton } from '../../ui/Skeleton'

type CustomerTreatmentHistoryTabProps = {
  customerId: string
}

export default function CustomerTreatmentHistoryTab({ customerId }: CustomerTreatmentHistoryTabProps) {
  const toast = useAppToast()
  const [records, setRecords] = useState<TreatmentRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<TreatmentRecord | null>(null)
  const [form, setForm] = useState<TreatmentRecordCreateInput>({
    customer_id: customerId,
    treatment_name: '',
    treatment_content: '',
    skin_condition_before: '',
    skin_condition_after: '',
    notes: '',
  })

  useEffect(() => {
    loadRecords()
  }, [customerId])

  const loadRecords = async () => {
    try {
      setLoading(true)
      const data = await treatmentRecordsApi.list(customerId)
      setRecords(data)
    } catch (err) {
      console.error('시술 기록 로드 실패:', err)
      toast.error('시술 기록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await treatmentRecordsApi.create(form)
      hapticFeedback('success')
      toast.success('시술 기록이 생성되었습니다.')
      setCreateModalOpen(false)
      setForm({
        customer_id: customerId,
        treatment_name: '',
        treatment_content: '',
        skin_condition_before: '',
        skin_condition_after: '',
        notes: '',
      })
      loadRecords()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '시술 기록 생성 실패'
      hapticFeedback('error')
      toast.error('생성 실패', errorMessage)
    }
  }

  const handleUpdate = async () => {
    if (!selectedRecord) return

    try {
      await treatmentRecordsApi.update(selectedRecord.id, form)
      hapticFeedback('success')
      toast.success('시술 기록이 수정되었습니다.')
      setEditModalOpen(false)
      setSelectedRecord(null)
      loadRecords()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '시술 기록 수정 실패'
      toast.error('수정 실패', errorMessage)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 시술 기록을 삭제하시겠습니까?')) return
    hapticFeedback('warning')

    try {
      await treatmentRecordsApi.delete(id)
      hapticFeedback('success')
      toast.success('시술 기록이 삭제되었습니다.')
      loadRecords()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '시술 기록 삭제 실패'
      hapticFeedback('error')
      toast.error('삭제 실패', errorMessage)
    }
  }

  const handleEdit = (record: TreatmentRecord) => {
    setSelectedRecord(record)
    setForm({
      customer_id: record.customer_id,
      treatment_name: record.treatment_name,
      treatment_content: record.treatment_content || '',
      skin_condition_before: record.skin_condition_before || '',
      skin_condition_after: record.skin_condition_after || '',
      notes: record.notes || '',
      before_images: record.before_images || [],
      after_images: record.after_images || [],
      treatment_date: record.treatment_date,
    })
    setEditModalOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">시술 히스토리</h3>
        <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          시술 기록 추가
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
          <p>시술 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-neutral-900 mb-1">{record.treatment_name}</h4>
                  <div className="flex items-center gap-4 text-sm text-neutral-600 mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(record.treatment_date).toLocaleDateString('ko-KR')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(record.treatment_date).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(record)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(record.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {record.treatment_content && (
                <div className="mb-3">
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap">{record.treatment_content}</p>
                </div>
              )}

              {(record.skin_condition_before || record.skin_condition_after) && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {record.skin_condition_before && (
                    <div className="bg-amber-50 border border-amber-200 rounded p-2">
                      <div className="text-xs font-medium text-amber-900 mb-1">시술 전</div>
                      <div className="text-sm text-amber-800">{record.skin_condition_before}</div>
                    </div>
                  )}
                  {record.skin_condition_after && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded p-2">
                      <div className="text-xs font-medium text-emerald-900 mb-1">시술 후</div>
                      <div className="text-sm text-emerald-800">{record.skin_condition_after}</div>
                    </div>
                  )}
                </div>
              )}

              {(record.before_images && record.before_images.length > 0) ||
              (record.after_images && record.after_images.length > 0) ? (
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <ImageIcon className="h-4 w-4" />
                  <span>
                    {record.before_images?.length || 0}장 (전) / {record.after_images?.length || 0}장 (후)
                  </span>
                </div>
              ) : null}

              {record.notes && (
                <div className="mt-3 pt-3 border-t border-neutral-200">
                  <div className="text-xs font-medium text-neutral-600 mb-1">메모</div>
                  <div className="text-sm text-neutral-700">{record.notes}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 시술 기록 생성 모달 */}
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} size="lg">
        <ModalHeader title="시술 기록 추가" description="고객의 시술 내역을 기록합니다." />
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">시술명 *</label>
              <input
                type="text"
                value={form.treatment_name}
                onChange={(e) => setForm({ ...form, treatment_name: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="예: 기미 관리 시술"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">시술 내용</label>
              <textarea
                value={form.treatment_content}
                onChange={(e) => setForm({ ...form, treatment_content: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="시술 내용을 입력하세요"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">시술 전 피부 상태</label>
                <textarea
                  value={form.skin_condition_before}
                  onChange={(e) => setForm({ ...form, skin_condition_before: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="시술 전 피부 상태"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">시술 후 피부 상태</label>
                <textarea
                  value={form.skin_condition_after}
                  onChange={(e) => setForm({ ...form, skin_condition_after: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="시술 후 피부 상태"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">메모</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="추가 메모"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={!form.treatment_name.trim()}
          >
            저장
          </Button>
        </ModalFooter>
      </Modal>

      {/* 시술 기록 수정 모달 */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} size="lg">
        <ModalHeader title="시술 기록 수정" description="시술 기록을 수정합니다." />
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">시술명 *</label>
              <input
                type="text"
                value={form.treatment_name}
                onChange={(e) => setForm({ ...form, treatment_name: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">시술 내용</label>
              <textarea
                value={form.treatment_content}
                onChange={(e) => setForm({ ...form, treatment_content: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">시술 전 피부 상태</label>
                <textarea
                  value={form.skin_condition_before}
                  onChange={(e) => setForm({ ...form, skin_condition_before: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">시술 후 피부 상태</label>
                <textarea
                  value={form.skin_condition_after}
                  onChange={(e) => setForm({ ...form, skin_condition_after: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">메모</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdate}
            disabled={!form.treatment_name.trim()}
          >
            저장
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

