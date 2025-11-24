'use client'

import { useEffect, useState } from 'react'
import { Calendar, CheckCircle, Clock, Plus, Pencil, Trash2, TrendingUp } from 'lucide-react'
import Button from '../../ui/Button'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../../ui/Modal'
import { useAppToast } from '@/app/lib/ui/toast'
import { treatmentProgramsApi } from '@/app/lib/api/treatment-programs'
import { productsApi } from '@/app/lib/api/products'
import { hapticFeedback } from '@/app/lib/utils/haptic'
import type { TreatmentProgram, TreatmentProgramCreateInput } from '@/types/entities'
import { Skeleton } from '../../ui/Skeleton'

type CustomerProgramsTabProps = {
  customerId: string
}

export default function CustomerProgramsTab({ customerId }: CustomerProgramsTabProps) {
  const toast = useAppToast()
  const [programs, setPrograms] = useState<TreatmentProgram[]>([])
  const [products, setProducts] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<TreatmentProgram | null>(null)
  const [form, setForm] = useState<TreatmentProgramCreateInput>({
    customer_id: customerId,
    program_name: '',
    total_sessions: 1,
    product_id: null,
    expires_at: null,
    notes: '',
  })

  useEffect(() => {
    loadPrograms()
    loadProducts()
  }, [customerId])

  const loadPrograms = async () => {
    try {
      setLoading(true)
      const data = await treatmentProgramsApi.list(customerId)
      setPrograms(data)
    } catch (err) {
      console.error('시술 프로그램 로드 실패:', err)
      toast.error('시술 프로그램을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const data = await productsApi.list({ limit: 1000 })
      setProducts(data.map(p => ({ id: p.id, name: p.name })))
    } catch (err) {
      console.error('상품 로드 실패:', err)
    }
  }

  const handleCreate = async () => {
    try {
      await treatmentProgramsApi.create(form)
      hapticFeedback('success')
      toast.success('시술 프로그램이 생성되었습니다.')
      setCreateModalOpen(false)
      setForm({
        customer_id: customerId,
        program_name: '',
        total_sessions: 1,
        product_id: null,
        expires_at: null,
        notes: '',
      })
      loadPrograms()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '시술 프로그램 생성 실패'
      hapticFeedback('error')
      toast.error('생성 실패', errorMessage)
    }
  }

  const handleUpdate = async () => {
    if (!selectedProgram) return

    try {
      await treatmentProgramsApi.update(selectedProgram.id, form)
      hapticFeedback('success')
      toast.success('시술 프로그램이 수정되었습니다.')
      setEditModalOpen(false)
      setSelectedProgram(null)
      loadPrograms()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '시술 프로그램 수정 실패'
      toast.error('수정 실패', errorMessage)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 시술 프로그램을 삭제하시겠습니까?')) return
    hapticFeedback('warning')

    try {
      await treatmentProgramsApi.delete(id)
      hapticFeedback('success')
      toast.success('시술 프로그램이 삭제되었습니다.')
      loadPrograms()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '시술 프로그램 삭제 실패'
      hapticFeedback('error')
      toast.error('삭제 실패', errorMessage)
    }
  }

  const handleEdit = (program: TreatmentProgram) => {
    setSelectedProgram(program)
    setForm({
      customer_id: program.customer_id,
      program_name: program.program_name,
      total_sessions: program.total_sessions,
      product_id: program.product_id || null,
      expires_at: program.expires_at || null,
      notes: program.notes || '',
    })
    setEditModalOpen(true)
  }

  const getProgressPercentage = (program: TreatmentProgram) => {
    if (program.total_sessions === 0) return 0
    return Math.round((program.completed_sessions / program.total_sessions) * 100)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">시술 프로그램</h3>
        <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          프로그램 추가
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
          <p>시술 프로그램이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {programs.map((program) => {
            const progress = getProgressPercentage(program)
            const isCompleted = program.completed_sessions >= program.total_sessions

            return (
              <div
                key={program.id}
                className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-neutral-900 mb-1">{program.program_name}</h4>
                    <div className="flex items-center gap-4 text-sm text-neutral-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        시작일: {new Date(program.started_at).toLocaleDateString('ko-KR')}
                      </div>
                      {program.expires_at && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          만료일: {new Date(program.expires_at).toLocaleDateString('ko-KR')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(program)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(program.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* 진행도 */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-neutral-700">
                      진행도: {program.completed_sessions} / {program.total_sessions}회
                    </span>
                    <span className="text-sm font-semibold text-pink-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        isCompleted ? 'bg-emerald-500' : 'bg-pink-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {program.notes && (
                  <div className="mt-3 pt-3 border-t border-neutral-200">
                    <div className="text-xs font-medium text-neutral-600 mb-1">메모</div>
                    <div className="text-sm text-neutral-700">{program.notes}</div>
                  </div>
                )}

                {isCompleted && (
                  <div className="mt-3 flex items-center gap-1 text-emerald-600 text-sm font-medium">
                    <CheckCircle className="h-4 w-4" />
                    프로그램 완료
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 시술 프로그램 생성 모달 */}
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} size="md">
        <ModalHeader title="시술 프로그램 추가" description="고객의 시술 프로그램을 생성합니다." />
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">프로그램명 *</label>
              <input
                type="text"
                value={form.program_name}
                onChange={(e) => setForm({ ...form, program_name: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="예: 기미 관리 10회 프로그램"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">총 횟수 *</label>
              <input
                type="number"
                min="1"
                value={form.total_sessions}
                onChange={(e) => setForm({ ...form, total_sessions: Number(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">연결 상품 (선택)</label>
              <select
                value={form.product_id || ''}
                onChange={(e) => setForm({ ...form, product_id: e.target.value || null })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">선택 안함</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">만료일 (선택)</label>
              <input
                type="date"
                value={form.expires_at ? new Date(form.expires_at).toISOString().split('T')[0] : ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    expires_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">메모</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="프로그램 관련 메모"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
            취소
          </Button>
          <Button variant="primary" onClick={handleCreate} disabled={!form.program_name.trim()}>
            저장
          </Button>
        </ModalFooter>
      </Modal>

      {/* 시술 프로그램 수정 모달 */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} size="md">
        <ModalHeader title="시술 프로그램 수정" description="시술 프로그램을 수정합니다." />
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">프로그램명 *</label>
              <input
                type="text"
                value={form.program_name}
                onChange={(e) => setForm({ ...form, program_name: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">총 횟수 *</label>
              <input
                type="number"
                min="1"
                value={form.total_sessions}
                onChange={(e) => setForm({ ...form, total_sessions: Number(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">연결 상품 (선택)</label>
              <select
                value={form.product_id || ''}
                onChange={(e) => setForm({ ...form, product_id: e.target.value || null })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">선택 안함</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">만료일 (선택)</label>
              <input
                type="date"
                value={form.expires_at ? new Date(form.expires_at).toISOString().split('T')[0] : ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    expires_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
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
          <Button variant="primary" onClick={handleUpdate} disabled={!form.program_name.trim()}>
            저장
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

