'use client'

import { useState } from 'react'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { useAppToast } from '@/app/lib/ui/toast'

type Role = 'OWNER' | 'STAFF'

interface InviteStaffModalProps {
  open: boolean
  onClose: () => void
  onInvited: () => void
}

export default function InviteStaffModal({ open, onClose, onInvited }: InviteStaffModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('STAFF')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useAppToast()

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('이메일을 입력해주세요.')
      return
    }

    if (!/.+@.+\..+/.test(email.trim())) {
      setError('유효한 이메일 형식을 입력해주세요.')
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
        body: JSON.stringify({
          email: email.trim(),
          role,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '초대 발송에 실패했습니다.')
      }

      const data = await response.json()

      toast.success('초대가 성공적으로 발송되었습니다.')
      onInvited()
      onClose()
      setEmail('')
      setRole('STAFF')
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
    setRole('STAFF')
    setError('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} size="md">
      <ModalHeader title="직원 초대" description="새 직원을 초대합니다. 초대받은 사용자는 자동으로 가입할 수 있습니다." />

      <ModalBody>
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
              {error}
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

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              초대할 역할
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="STAFF"
                  checked={role === 'STAFF'}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-4 h-4 text-[#F472B6] border-neutral-300 focus:ring-[#F472B6]"
                  disabled={loading}
                />
                <span className="ml-2 text-sm text-neutral-700">직원 (Staff)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="OWNER"
                  checked={role === 'OWNER'}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-4 h-4 text-[#F472B6] border-neutral-300 focus:ring-[#F472B6]"
                  disabled={loading}
                />
                <span className="ml-2 text-sm text-neutral-700">점주 (Owner)</span>
              </label>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {role === 'STAFF'
                ? '직원은 고객 관리 및 예약 업무를 담당합니다.'
                : '점주는 지점 운영 및 직원 관리를 담당합니다.'}
            </p>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button
          variant="secondary"
          onClick={handleClose}
          disabled={loading}
        >
          취소
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading || !email.trim()}
          loading={loading}
        >
          {loading ? '초대 발송 중...' : '초대 보내기'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
