'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/app/components/common/PageHeader'
import LoadingState from '@/app/components/common/LoadingState'
import ErrorState from '@/app/components/common/ErrorState'
import Card from '@/app/components/ui/Card'
import Button from '@/app/components/ui/Button'
import { Mail, CheckCircle, XCircle, Clock, Trash2, Copy } from 'lucide-react'
import { useAppToast } from '@/app/lib/ui/toast'
import { useCurrentUser } from '@/app/lib/hooks/useCurrentUser'
import { invitationsApi } from '@/app/lib/api/invitations'
import type { Invitation } from '@/types/entities'
import Tabs, { TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/Tabs'

type InvitationWithBranch = Invitation & {
  branches?: {
    name: string
    code: string
  } | null
  profiles?: {
    name: string
  } | null
}

export default function InvitationsPage() {
  const router = useRouter()
  const toast = useAppToast()
  const { role, isHQ } = useCurrentUser()
  const [invitations, setInvitations] = useState<InvitationWithBranch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'used' | 'expired'>('all')

  // HQ 권한 확인
  useEffect(() => {
    if (role && !isHQ) {
      toast.error('접근 권한이 없습니다.', '초대 코드 관리는 본사(HQ)만 사용할 수 있습니다.')
      router.push('/dashboard')
    }
  }, [role, isHQ, router, toast])

  // 초대 목록 로드
  const load = useCallback(async () => {
    if (!isHQ) return

    try {
      setLoading(true)
      setError('')

      const data = await invitationsApi.list()
      setInvitations(data as InvitationWithBranch[])
    } catch (err) {
      console.error('Failed to load invitations:', err)
      const errorMessage = err instanceof Error ? err.message : '초대 목록을 불러오는데 실패했습니다.'
      setError(errorMessage)
      toast.error('로드 실패', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isHQ, toast])

  useEffect(() => {
    load()
  }, [load])

  // 초대 코드 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 초대 코드를 삭제하시겠습니까?')) return

    try {
      await invitationsApi.delete(id)
      toast.success('초대 코드가 삭제되었습니다.')
      load()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '삭제 실패'
      toast.error('삭제 실패', errorMessage)
    }
  }

  // 초대 코드 복사
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('초대 코드가 클립보드에 복사되었습니다.')
  }

  // 필터링된 초대 목록
  const filteredInvitations = invitations.filter((inv) => {
    const now = new Date()
    const expiresAt = new Date(inv.expires_at)
    const isExpired = expiresAt < now
    const isUsed = !!inv.used_at

    if (activeTab === 'pending') return !isUsed && !isExpired
    if (activeTab === 'used') return isUsed
    if (activeTab === 'expired') return !isUsed && isExpired
    return true
  })

  if (role && !isHQ) {
    return null
  }

  return (
    <main className="space-y-4 sm:space-y-5 md:space-y-6">
      <PageHeader
        title="초대 코드 관리"
        description="발송된 초대 코드를 관리하고 상태를 확인할 수 있습니다."
      />

      {error && <ErrorState title="오류 발생" message={error} onRetry={load} />}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="pending">대기 중</TabsTrigger>
          <TabsTrigger value="used">사용됨</TabsTrigger>
          <TabsTrigger value="expired">만료됨</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <LoadingState rows={6} variant="table" />
          ) : filteredInvitations.length === 0 ? (
            <Card className="p-8 text-center">
              <Mail className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-500">초대 코드가 없습니다.</p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-900">이메일</th>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-900">역할</th>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-900">지점</th>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-900">초대 코드</th>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-900">상태</th>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-900">만료일</th>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-900">생성일</th>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-900">동작</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredInvitations.map((inv) => {
                      const now = new Date()
                      const expiresAt = new Date(inv.expires_at)
                      const isExpired = expiresAt < now
                      const isUsed = !!inv.used_at

                      return (
                        <tr key={inv.id} className="hover:bg-neutral-50">
                          <td className="px-4 py-3 text-neutral-900">{inv.email}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                inv.role === 'OWNER'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {inv.role === 'OWNER' ? '점주' : '직원'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-neutral-700">
                            {inv.branches ? (
                              <div>
                                <div className="font-medium">{inv.branches.name}</div>
                                <div className="text-xs text-neutral-500">{inv.branches.code}</div>
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-neutral-100 px-2 py-1 rounded font-mono">
                                {inv.invite_code}
                              </code>
                              <button
                                onClick={() => handleCopy(inv.invite_code)}
                                className="p-1 hover:bg-neutral-200 rounded transition-colors"
                                title="복사"
                              >
                                <Copy className="h-4 w-4 text-neutral-600" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {isUsed ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-xs">사용됨</span>
                              </div>
                            ) : isExpired ? (
                              <div className="flex items-center gap-1 text-red-600">
                                <XCircle className="h-4 w-4" />
                                <span className="text-xs">만료됨</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-amber-600">
                                <Clock className="h-4 w-4" />
                                <span className="text-xs">대기 중</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-neutral-600 text-xs">
                            {new Date(inv.expires_at).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="px-4 py-3 text-neutral-600 text-xs">
                            {inv.created_at
                              ? new Date(inv.created_at).toLocaleDateString('ko-KR')
                              : '-'}
                          </td>
                          <td className="px-4 py-3">
                            {!isUsed && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(inv.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </main>
  )
}

