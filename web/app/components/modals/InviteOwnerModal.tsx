'use client'

import { useState, useEffect } from 'react'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import { useAppToast } from '@/app/lib/ui/toast'
import { branchApi } from '@/app/lib/api/branches'
import type { Branch } from '@/types/entities'

interface InviteOwnerModalProps {
  open: boolean
  onClose: () => void
  onInvited: () => void
  branchId?: string | null // 특정 지점에 초대하는 경우
}

export default function InviteOwnerModal({
  open,
  onClose,
  onInvited,
  branchId: initialBranchId,
}: InviteOwnerModalProps) {
  const [email, setEmail] = useState('')
  const [branchId, setBranchId] = useState<string>(initialBranchId || '')
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [error, setError] = useState('')
  const toast = useAppToast()

  // 지점 목록 로드
  useEffect(() => {
    if (open && !initialBranchId) {
      loadBranches()
    }
  }, [open, initialBranchId])

  const loadBranches = async () => {
    try {
      setLoadingBranches(true)
      const data = await branchApi.list()
      setBranches(data)
      if (data.length > 0 && !branchId) {
        setBranchId(data[0].id)
      }
    } catch (err) {
      console.error('Failed to load branches:', err)
      toast.error('지점 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoadingBranches(false)
    }
  }

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('이메일을 입력해주세요.')
      return
    }

    if (!/.+@.+\..+/.test(email.trim())) {
      setError('유효한 이메일 형식을 입력해주세요.')
      return
    }

    if (!branchId) {
      setError('지점을 선택해주세요.')
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          role: 'OWNER',
          branch_id: branchId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '초대 발송에 실패했습니다.')
      }

      toast.success('지점장 초대가 성공적으로 발송되었습니다.')
      onInvited()
      handleClose()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '초대 발송 중 오류가 발생했습니다.'
      setError(errorMessage)
      toast.error('초대 발송 실패', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    if (!initialBranchId) {
      setBranchId('')
    }
    setError('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} size="md">
      <ModalHeader
        title="지점장 초대"
        description="새 지점장을 초대합니다. 초대받은 사용자는 자동으로 가입할 수 있습니다."
      />

      <ModalBody>
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {!initialBranchId && (
            <div>
              <label htmlFor="branch-select" className="block text-sm font-medium text-neutral-700 mb-2">
                지점 선택 <span className="text-rose-500">*</span>
              </label>
              <Select
                id="branch-select"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                disabled={loading || loadingBranches}
              >
                <option value="">지점을 선택하세요</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </Select>
              {loadingBranches && (
                <p className="text-xs text-neutral-500 mt-1">지점 목록을 불러오는 중...</p>
              )}
            </div>
          )}

          <Input
            label="이메일 주소"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="초대할 이메일을 입력하세요"
            required
            disabled={loading}
          />

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>안내:</strong> 지점장은 해당 지점의 운영 및 직원 관리를 담당합니다. 초대받은 사용자는 회원가입 시 초대 코드를 입력하여 가입할 수 있습니다.
            </p>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          취소
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading || !email.trim() || !branchId}
          loading={loading}
        >
          {loading ? '초대 발송 중...' : '초대 보내기'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

