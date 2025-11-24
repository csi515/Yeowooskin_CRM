'use client'

import { useState, useTransition } from 'react'
import Button from '@/app/components/ui/Button'
import { CheckCircle, XCircle } from 'lucide-react'

export default function ApproveButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition()
  const [rejectPending, setRejectPending] = useState(false)
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null)
  const [err, setErr] = useState('')

  const handleApprove = () => {
    setErr('')
    startTransition(async () => {
      try {
        const { adminApi } = await import('@/app/lib/api/admin')
        await adminApi.approveUser({ userId, approved: true })
        setDone('approved')
        // 간단히 새로고침
        setTimeout(() => window.location.reload(), 500)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '승인 실패'
        setErr(errorMessage)
      }
    })
  }

  const handleReject = () => {
    if (!confirm('정말 거절하시겠습니까? 거절된 사용자는 로그인할 수 없습니다.')) {
      return
    }
    setErr('')
    setRejectPending(true)
    startTransition(async () => {
      try {
        const { adminApi } = await import('@/app/lib/api/admin')
        await adminApi.approveUser({ userId, approved: false })
        setDone('rejected')
        // 간단히 새로고침
        setTimeout(() => window.location.reload(), 500)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '거절 실패'
        setErr(errorMessage)
      } finally {
        setRejectPending(false)
      }
    })
  }

  if (done === 'approved') {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <CheckCircle className="h-4 w-4" />
        <span>승인됨</span>
      </div>
    )
  }

  if (done === 'rejected') {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <XCircle className="h-4 w-4" />
        <span>거절됨</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="primary"
        size="sm"
        loading={pending}
        disabled={pending || rejectPending}
        onClick={handleApprove}
        leftIcon={<CheckCircle className="h-4 w-4" />}
      >
        승인
      </Button>
      <Button
        variant="danger"
        size="sm"
        loading={rejectPending}
        disabled={pending || rejectPending}
        onClick={handleReject}
        leftIcon={<XCircle className="h-4 w-4" />}
      >
        거절
      </Button>
      {err && <span className="text-red-600 text-xs">{err}</span>}
    </div>
  )
}


