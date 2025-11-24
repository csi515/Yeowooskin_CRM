'use client'

import { useState, useTransition } from 'react'
import Button from '../components/ui/Button'
import { CheckCircle, XCircle } from 'lucide-react'

interface BatchApproveActionsProps {
  selectedIds: string[]
  onSuccess: () => void
}

export default function BatchApproveActions({ selectedIds, onSuccess }: BatchApproveActionsProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  if (selectedIds.length === 0) {
    return null
  }

  const handleBatchApprove = (approved: boolean) => {
    if (selectedIds.length === 0) return
    
    const action = approved ? '승인' : '거절'
    if (!confirm(`선택한 ${selectedIds.length}명의 사용자를 ${action}하시겠습니까?`)) {
      return
    }

    setError('')
    startTransition(async () => {
      try {
        const { adminApi } = await import('@/app/lib/api/admin')
        await adminApi.batchApproveUsers({ userIds: selectedIds, approved })
        onSuccess()
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '일괄 처리 실패'
        setError(errorMessage)
      }
    })
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-blue-900">
          {selectedIds.length}명 선택됨
        </span>
      </div>
      <div className="flex items-center gap-2">
        {error && <span className="text-red-600 text-xs">{error}</span>}
        <Button
          variant="danger"
          size="sm"
          loading={pending}
          disabled={pending}
          onClick={() => handleBatchApprove(false)}
          leftIcon={<XCircle className="h-4 w-4" />}
        >
          일괄 거절
        </Button>
        <Button
          variant="primary"
          size="sm"
          loading={pending}
          disabled={pending}
          onClick={() => handleBatchApprove(true)}
          leftIcon={<CheckCircle className="h-4 w-4" />}
        >
          일괄 승인
        </Button>
      </div>
    </div>
  )
}

