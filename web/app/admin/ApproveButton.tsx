'use client'

import { useState, useTransition } from 'react'
import Button from '@/app/components/ui/Button'

export default function ApproveButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="primary"
        size="sm"
        loading={pending}
        disabled={pending || done}
        onClick={() => {
          setErr('')
          startTransition(async () => {
            try {
              const { adminApi } = await import('@/app/lib/api/admin')
              await adminApi.approveUser({ userId, approved: true })
              setDone(true)
              // 간단히 새로고침
              window.location.reload()
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : '승인 실패'
              setErr(errorMessage)
            }
          })
        }}
      >
        {done ? '승인됨' : (pending ? '처리중...' : '승인')}
      </Button>
      {err && <span className="text-red-600 text-xs">{err}</span>}
    </div>
  )
}


