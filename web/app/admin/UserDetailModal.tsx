'use client'

import Modal, { ModalBody, ModalFooter, ModalHeader } from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { Phone, Building2, Calendar, Shield } from 'lucide-react'

type PendingUser = {
  id: string
  email: string
  name: string | null
  phone: string | null
  role: 'HQ' | 'OWNER' | 'STAFF'
  branch_id: string | null
  created_at: string
  branches?: {
    name: string
    code: string
  } | null
}

interface UserDetailModalProps {
  open: boolean
  onClose: () => void
  user: PendingUser | null
}

export default function UserDetailModal({ open, onClose, user }: UserDetailModalProps) {
  if (!open || !user) return null

  const roleLabels = {
    HQ: '본사',
    OWNER: '점주',
    STAFF: '직원',
  }

  const roleColors = {
    HQ: 'bg-gray-100 text-gray-800',
    OWNER: 'bg-blue-100 text-blue-800',
    STAFF: 'bg-purple-100 text-purple-800',
  }

  return (
    <Modal open={open} onClose={onClose} size="md">
      <ModalHeader title="사용자 정보" />
      <ModalBody>
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-neutral-900">
                {user.name || '이름 없음'}
              </h3>
              <p className="text-sm text-neutral-600">{user.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-neutral-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-neutral-500 mb-1">역할</p>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}
                >
                  {roleLabels[user.role]}
                </span>
              </div>
            </div>

            {user.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-neutral-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-neutral-500 mb-1">전화번호</p>
                  <p className="text-sm text-neutral-900">{user.phone}</p>
                </div>
              </div>
            )}

            {user.branches && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-neutral-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-neutral-500 mb-1">지점</p>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{user.branches.name}</p>
                    <p className="text-xs text-neutral-500">{user.branches.code}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-neutral-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-neutral-500 mb-1">가입일</p>
                <p className="text-sm text-neutral-900">
                  {new Date(user.created_at).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} className="w-full md:w-auto">
          닫기
        </Button>
      </ModalFooter>
    </Modal>
  )
}

