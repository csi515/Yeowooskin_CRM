'use client'

import { useEffect, useState } from 'react'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { useAppToast } from '@/app/lib/ui/toast'
import { branchApi } from '@/app/lib/api/branches'
import type { Branch } from '@/types/entities'

type BranchForm = {
  code: string
  name: string
  address?: string | null
  phone?: string | null
}

export default function BranchDetailModal({
  open,
  onClose,
  item,
  onSaved,
  onDeleted,
}: {
  open: boolean
  onClose: () => void
  item: Branch | null
  onSaved: () => void
  onDeleted: () => void
}) {
  const [form, setForm] = useState<BranchForm>({
    code: '',
    name: '',
    address: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useAppToast()

  useEffect(() => {
    if (item) {
      setForm({
        code: item.code || '',
        name: item.name || '',
        address: item.address || '',
        phone: item.phone || '',
      })
    } else {
      setForm({
        code: '',
        name: '',
        address: '',
        phone: '',
      })
    }
    setError('')
  }, [item, open])

  const save = async () => {
    try {
      setLoading(true)
      setError('')

      const code = form.code.trim()
      const name = form.name.trim()

      if (!code) {
        throw new Error('지점 코드는 필수입니다.')
      }
      if (!name) {
        throw new Error('지점명은 필수입니다.')
      }

      const body = {
        code,
        name,
        address: form.address?.trim() || null,
        phone: form.phone?.trim() || null,
      }

      if (item?.id) {
        await branchApi.update(item.id, body)
        toast.success('지점이 수정되었습니다.')
      } else {
        await branchApi.create(body)
        toast.success('지점이 생성되었습니다.')
      }

      onSaved()
      onClose()
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '에러가 발생했습니다.'
      setError(errorMessage)
      toast.error('저장 실패', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const removeItem = async () => {
    if (!item?.id) return
    if (!confirm('정말 삭제하시겠습니까? 삭제된 지점은 복구할 수 없습니다.')) return

    try {
      setLoading(true)
      await branchApi.delete(item.id)
      toast.success('지점이 삭제되었습니다.')
      onDeleted()
      onClose()
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '삭제 실패'
      toast.error('삭제 실패', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader
        title={item ? '지점 수정' : '지점 추가'}
        description="지점 정보를 관리합니다. 지점 코드와 지점명은 필수입니다."
      />
      <ModalBody>
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200" role="alert">
              <p className="text-sm text-rose-600">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <Input
              label="지점 코드"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="예: BRANCH_001"
              required
              disabled={!!item?.id} // 수정 시 코드 변경 불가
              error={!form.code.trim() ? '지점 코드는 필수입니다.' : undefined}
            />

            <Input
              label="지점명"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="예: 강남점"
              required
              error={!form.name.trim() ? '지점명은 필수입니다.' : undefined}
            />

            <Input
              label="주소"
              value={form.address || ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="예: 서울시 강남구 테헤란로 123"
            />

            <Input
              label="전화번호"
              value={form.phone || ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="예: 02-1234-5678"
            />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        {item?.id && (
          <Button variant="danger" onClick={removeItem} disabled={loading}>
            삭제
          </Button>
        )}
        <div className="flex-1" />
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          취소
        </Button>
        <Button variant="primary" onClick={save} loading={loading} disabled={loading}>
          저장
        </Button>
      </ModalFooter>
    </Modal>
  )
}

