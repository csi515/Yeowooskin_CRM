'use client'

import { useEffect, useState, useCallback } from 'react'
import PageHeader, { createActionButton } from '@/app/components/common/PageHeader'
import LoadingState from '@/app/components/common/LoadingState'
import ErrorState from '@/app/components/common/ErrorState'
import FloatingActionButton from '@/app/components/common/FloatingActionButton'
import { Users, Pencil, UserPlus, Mail, CheckCircle, XCircle, Clock } from 'lucide-react'
import EmptyState from '@/app/components/EmptyState'
import StaffDetailModal from '@/app/components/modals/StaffDetailModal'
import InviteStaffModal from '@/app/components/modals/InviteStaffModal'
import { useTableData } from '@/app/lib/hooks/useTableData'
import { useAppToast } from '@/app/lib/ui/toast'
import { useAuth } from '@/app/components/AuthProvider'
import Tabs, { TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/Tabs'

type Staff = { id: string; name: string; phone?: string; email?: string; role?: string; notes?: string; active?: boolean; created_at?: string }
type Invitation = {
  id: string
  email: string
  role: 'OWNER' | 'STAFF'
  invite_code: string
  expires_at: string
  used_at?: string
  created_at: string
  profiles?: { name?: string }
}

export default function StaffPage() {
  const { user } = useAuth()
  const toast = useAppToast()
  const [rows, setRows] = useState<Staff[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [selected, setSelected] = useState<Staff | null>(null)
  const [activeTab, setActiveTab] = useState<'staff' | 'invitations'>('staff')
  const [userRole, setUserRole] = useState<'HQ' | 'OWNER' | 'STAFF' | null>(null)
  const [userBranchId, setUserBranchId] = useState<string | null>(null)

  // 통합 테이블 데이터 훅 사용
  const tableData = useTableData<Staff>({
    data: rows,
    searchOptions: {
      debounceMs: 300,
      searchFields: ['name', 'email', 'phone', 'role'],
    },
    sortOptions: {
      initialKey: 'name',
      initialDirection: 'asc',
    },
  })

  const debouncedQuery = tableData.debouncedQuery

  // 사용자 프로필 로드
  const loadUserProfile = useCallback(async () => {
    if (!user?.id) return

    try {
      const { createSupabaseBrowserClient } = await import('@/lib/supabase/client')
      const supabase = createSupabaseBrowserClient()

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, branch_id')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Profile load error:', error)
        setError('프로필 정보를 불러올 수 없습니다.')
        return
      }

      setUserRole(profile.role)
      setUserBranchId(profile.branch_id)
    } catch (err) {
      console.error('Profile load failed:', err)
      setError('프로필 정보를 불러올 수 없습니다.')
    }
  }, [user?.id])

  // 직원 목록 로드
  const loadStaff = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const { staffApi } = await import('@/app/lib/api/staff')

      // 역할에 따른 필터링
      const queryParams: any = {}
      if (debouncedQuery.trim()) {
        queryParams.search = debouncedQuery
      }

      // Owner는 자신의 지점만, HQ는 모두 조회
      if (userRole === 'OWNER' && userBranchId) {
        queryParams.branch_id = userBranchId
      }

      const data = await staffApi.list(queryParams)
      setRows(Array.isArray(data) ? (data as Staff[]) : [])
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '에러가 발생했습니다.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, userRole, userBranchId])

  // 초대 목록 로드
  const loadInvitations = useCallback(async () => {
    try {
      const response = await fetch('/api/invitations')
      if (!response.ok) {
        throw new Error('초대 목록을 불러올 수 없습니다.')
      }
      const data = await response.json()
      setInvitations(data.data || [])
    } catch (err) {
      console.error('Invitations load failed:', err)
    }
  }, [])

  const load = useCallback(async () => {
    await loadUserProfile()
    if (activeTab === 'staff') {
      await loadStaff()
    } else {
      await loadInvitations()
    }
  }, [loadUserProfile, loadStaff, loadInvitations, activeTab])

  useEffect(() => {
    load()
  }, [load])

  const handleInviteSuccess = () => {
    loadInvitations()
    toast.success('초대가 발송되었습니다.')
  }

  return (
    <main className="space-y-3 sm:space-y-4">
        <PageHeader
          title="직원 관리"
          icon={<Users className="h-5 w-5" />}
          description="직원 정보를 관리하고 초대할 수 있습니다"
          search={activeTab === 'staff' ? {
            value: tableData.query,
            onChange: tableData.setQuery,
            placeholder: '이름, 이메일, 전화번호, 직책으로 검색',
          } : undefined}
          actions={(userRole === 'OWNER' || userRole === 'HQ') ? [
            createActionButton(
              '직원 초대',
              () => setInviteOpen(true),
              'primary'
            )
          ] : undefined}
        />

        {error && <ErrorState message={error} onRetry={load} />}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'staff' | 'invitations')}>
          <TabsList className="bg-white rounded-lg border border-neutral-200 p-1 mb-4">
            <TabsTrigger value="staff">직원 목록</TabsTrigger>
            {(userRole === 'OWNER' || userRole === 'HQ') && (
              <TabsTrigger value="invitations">초대 관리</TabsTrigger>
            )}
          </TabsList>

          {/* 직원 목록 탭 */}
          <TabsContent value="staff">
            {loading ? (
              <LoadingState rows={8} variant="card" />
            ) : (
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tableData.sortedData.map((s, index) => {
                  const colorSchemes = [
                    { bg: 'from-pink-50 to-rose-100', border: 'border-pink-200', avatar: 'from-pink-200 to-rose-300', role: 'bg-pink-100 text-pink-700 border-pink-300' },
                    { bg: 'from-blue-50 to-cyan-100', border: 'border-blue-200', avatar: 'from-blue-200 to-cyan-300', role: 'bg-blue-100 text-blue-700 border-blue-300' },
                    { bg: 'from-emerald-50 to-teal-100', border: 'border-emerald-200', avatar: 'from-emerald-200 to-teal-300', role: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
                    { bg: 'from-amber-50 to-yellow-100', border: 'border-amber-200', avatar: 'from-amber-200 to-yellow-300', role: 'bg-amber-100 text-amber-700 border-amber-300' },
                    { bg: 'from-purple-50 to-violet-100', border: 'border-purple-200', avatar: 'from-purple-200 to-violet-300', role: 'bg-purple-100 text-purple-700 border-purple-300' },
                  ]
                  const scheme = colorSchemes[index % colorSchemes.length]!
                  return (
                    <div key={s.id} className={`bg-gradient-to-br ${scheme.bg} rounded-[16px] border-2 ${scheme.border} shadow-md p-4 hover:shadow-xl active:scale-[0.98] transition-all duration-300 touch-manipulation`}>
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${scheme.avatar} shadow-sm`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold truncate text-neutral-800">{s.name}</div>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${s.role ? scheme.role : 'bg-gray-100 text-gray-600 border-gray-200'}`}>{s.role || '직원'}</span>
                          </div>
                          <div className="mt-1 text-sm text-neutral-600 truncate">{s.phone || '-'}</div>
                          <div className="text-sm text-neutral-600 truncate">{s.email || '-'}</div>
                        </div>
                        <button
                          onClick={() => { setSelected(s); setDetailOpen(true) }}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-md border-2 border-pink-200 hover:bg-pink-100 text-pink-600 transition-colors"
                          aria-label="상세보기"
                          title="상세보기"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
                {tableData.sortedData.length === 0 && (
                  <div className="col-span-full">
                    <EmptyState
                      title="직원 데이터가 없습니다."
                      description="직원을 초대해보세요."
                    />
                  </div>
                )}
              </section>
            )}
          </TabsContent>

          {/* 초대 관리 탭 */}
          {(userRole === 'OWNER' || userRole === 'HQ') && (
            <TabsContent value="invitations">
              {loading ? (
                <LoadingState rows={6} variant="table" />
              ) : (
                <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-neutral-200">
                    <h3 className="text-lg font-semibold text-neutral-900">초대 목록</h3>
                    <p className="text-sm text-neutral-600 mt-1">보낸 초대와 상태를 확인할 수 있습니다.</p>
                  </div>

                  <div className="divide-y divide-neutral-200">
                    {invitations.length === 0 ? (
                      <div className="px-6 py-8 text-center">
                        <Mail className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                        <p className="text-neutral-500">보낸 초대가 없습니다.</p>
                      </div>
                    ) : (
                      invitations.map((invitation) => {
                        const isExpired = new Date(invitation.expires_at) < new Date()
                        const isUsed = !!invitation.used_at

                        return (
                          <div key={invitation.id} className="px-6 py-4 hover:bg-neutral-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {isUsed ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : isExpired ? (
                                  <XCircle className="h-5 w-5 text-red-500" />
                                ) : (
                                  <Clock className="h-5 w-5 text-amber-500" />
                                )}
                                <div>
                                  <div className="font-medium text-neutral-900">{invitation.email}</div>
                                  <div className="text-sm text-neutral-600">
                                    {invitation.role === 'OWNER' ? '점주' : '직원'} 초대
                                    {invitation.profiles?.name && ` · 초대자: ${invitation.profiles.name}`}
                                  </div>
                                  <div className="text-xs text-neutral-500 mt-1">
                                    {isUsed
                                      ? `사용됨 (${new Date(invitation.used_at!).toLocaleDateString()})`
                                      : isExpired
                                        ? `만료됨 (${new Date(invitation.expires_at).toLocaleDateString()})`
                                        : `만료일: ${new Date(invitation.expires_at).toLocaleDateString()}`
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>

        <StaffDetailModal
          open={detailOpen}
          item={selected}
          onClose={() => setDetailOpen(false)}
          onSaved={load}
          onDeleted={load}
        />

        <InviteStaffModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          onInvited={handleInviteSuccess}
        />

        {/* 모바일 FAB */}
        {(userRole === 'OWNER' || userRole === 'HQ') && (
          <FloatingActionButton
            onClick={() => setInviteOpen(true)}
            label="직원 초대"
            icon={<UserPlus className="h-6 w-6" />}
          />
        )}
      </main>
  )
}
