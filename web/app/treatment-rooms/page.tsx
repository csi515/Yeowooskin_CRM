'use client'

import { useEffect, useState, useCallback } from 'react'
import PageHeader from '@/app/components/common/PageHeader'
import LoadingState from '@/app/components/common/LoadingState'
import ErrorState from '@/app/components/common/ErrorState'
import Card from '@/app/components/ui/Card'
import Button from '@/app/components/ui/Button'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/app/components/ui/Modal'
import Input from '@/app/components/ui/Input'
import { DoorOpen, Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { useAppToast } from '@/app/lib/ui/toast'
import { treatmentRoomsApi } from '@/app/lib/api/treatment-rooms'
import type { TreatmentRoom, TreatmentRoomCreateInput } from '@/types/entities'

export default function TreatmentRoomsPage() {
  const toast = useAppToast()
  const [rooms, setRooms] = useState<TreatmentRoom[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TreatmentRoom | null>(null)
  const [form, setForm] = useState<TreatmentRoomCreateInput>({
    name: '',
    code: '',
    description: '',
    capacity: 1,
    active: true,
  })

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await treatmentRoomsApi.list()
      setRooms(data)
    } catch (err) {
      console.error('Failed to load treatment rooms:', err)
      const errorMessage = err instanceof Error ? err.message : '시술실 목록을 불러오는데 실패했습니다.'
      setError(errorMessage)
      toast.error('로드 실패', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = () => {
    setEditing(null)
    setForm({
      name: '',
      code: '',
      description: '',
      capacity: 1,
      active: true,
    })
    setModalOpen(true)
  }

  const handleEdit = (room: TreatmentRoom) => {
    setEditing(room)
    setForm({
      name: room.name,
      code: room.code || '',
      description: room.description || '',
      capacity: room.capacity,
      active: room.active,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editing) {
        await treatmentRoomsApi.update(editing.id, form)
        toast.success('시술실이 수정되었습니다.')
      } else {
        await treatmentRoomsApi.create(form)
        toast.success('시술실이 생성되었습니다.')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '저장 실패'
      toast.error('저장 실패', errorMessage)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 시술실을 삭제하시겠습니까?')) return

    try {
      await treatmentRoomsApi.delete(id)
      toast.success('시술실이 삭제되었습니다.')
      load()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '삭제 실패'
      toast.error('삭제 실패', errorMessage)
    }
  }

  return (
    <main className="space-y-4 sm:space-y-5 md:space-y-6">
      <PageHeader
        title="시술실 관리"
        description="시술실을 추가하고 관리할 수 있습니다."
      />

      {error && <ErrorState title="오류 발생" message={error} onRetry={load} />}

      <div className="flex justify-end mb-4">
        <Button variant="primary" onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-1" />
          시술실 추가
        </Button>
      </div>

      {loading ? (
        <LoadingState rows={6} variant="table" />
      ) : rooms.length === 0 ? (
        <Card className="p-8 text-center">
          <DoorOpen className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-500">시술실이 없습니다.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <Card key={room.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900 mb-1">{room.name}</h3>
                  {room.code && (
                    <p className="text-sm text-neutral-600 mb-1">코드: {room.code}</p>
                  )}
                  {room.description && (
                    <p className="text-sm text-neutral-600">{room.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {room.active ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-neutral-400" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200">
                <div className="text-sm text-neutral-600">
                  수용 인원: {room.capacity}명
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(room)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(room.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 생성/수정 모달 */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="md">
        <ModalHeader
          title={editing ? '시술실 수정' : '시술실 추가'}
          description={editing ? '시술실 정보를 수정합니다.' : '새로운 시술실을 추가합니다.'}
        />
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="시술실명 *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="예: 1호실, VIP룸"
            />

            <Input
              label="코드 (선택)"
              value={form.code || ''}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="예: ROOM-01"
            />

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">설명 (선택)</label>
              <textarea
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="시술실 설명"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">수용 인원 *</label>
              <input
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 text-pink-600"
                />
                <span className="text-sm text-neutral-700">활성화</span>
              </label>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setModalOpen(false)}>
            취소
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!form.name.trim()}>
            저장
          </Button>
        </ModalFooter>
      </Modal>
    </main>
  )
}

