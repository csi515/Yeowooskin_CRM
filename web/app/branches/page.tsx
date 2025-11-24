'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader, { createActionButton } from '@/app/components/common/PageHeader'
import LoadingState from '@/app/components/common/LoadingState'
import ErrorState from '@/app/components/common/ErrorState'
import { Building, Pencil, Plus, MapPin, Phone, UserPlus } from 'lucide-react'
import EmptyState from '@/app/components/EmptyState'
import BranchDetailModal from '@/app/components/modals/BranchDetailModal'
import InviteOwnerModal from '@/app/components/modals/InviteOwnerModal'
import { useTableData } from '@/app/lib/hooks/useTableData'
import { useAppToast } from '@/app/lib/ui/toast'
import { useCurrentUser } from '@/app/lib/hooks/useCurrentUser'
import { branchApi } from '@/app/lib/api/branches'
import type { Branch } from '@/types/entities'

export default function BranchesPage() {
  const router = useRouter()
  const toast = useAppToast()
  const { role, isHQ } = useCurrentUser()
  const [rows, setRows] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [selected, setSelected] = useState<Branch | null>(null)
  const [selectedBranchForInvite, setSelectedBranchForInvite] = useState<Branch | null>(null)

  // 통합 테이블 데이터 훅 사용
  const tableData = useTableData<Branch>({
    data: rows,
    searchOptions: {
      debounceMs: 300,
      searchFields: ['name', 'code', 'address'],
    },
    sortOptions: {
      initialKey: 'created_at',
      initialDirection: 'desc',
    },
  })

  const debouncedQuery = tableData.debouncedQuery

  // HQ 권한 확인
  useEffect(() => {
    if (role && !isHQ) {
      toast.error('접근 권한이 없습니다.', '지점 관리는 본사(HQ)만 사용할 수 있습니다.')
      router.push('/dashboard')
    }
  }, [role, isHQ, router, toast])

  // 지점 목록 로드
  const load = useCallback(async () => {
    if (!isHQ) return

    try {
      setLoading(true)
      setError('')

      const queryParams: any = {}
      if (debouncedQuery.trim()) {
        queryParams.search = debouncedQuery
      }

      const data = await branchApi.list(queryParams)
      setRows(data)
    } catch (err) {
      console.error('Failed to load branches:', err)
      const errorMessage = err instanceof Error ? err.message : '지점 목록을 불러오는데 실패했습니다.'
      setError(errorMessage)
      toast.error('로드 실패', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, isHQ, toast])

  useEffect(() => {
    load()
  }, [load])

  const handleSaved = () => {
    load()
  }

  const handleDeleted = () => {
    load()
  }

  if (role && !isHQ) {
    return null
  }

  return (
    <main className="space-y-4 sm:space-y-5 md:space-y-6">
      <PageHeader
        title="지점 관리"
        description="프랜차이즈 지점을 추가, 수정, 삭제할 수 있습니다."
        actions={[
          createActionButton({
            label: '지점 추가',
            icon: <Plus className="h-4 w-4" />,
            onClick: () => {
              setSelected(null)
              setDetailOpen(true)
            },
            variant: 'primary',
          }),
        ]}
      />

      {error && <ErrorState title="오류 발생" message={error} onRetry={load} />}

      {loading && !rows.length ? (
        <LoadingState rows={6} variant="grid" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Building className="h-12 w-12 text-neutral-400" />}
          title="지점이 없습니다"
          description="새로운 지점을 추가해보세요."
          action={
            <button
              onClick={() => {
                setSelected(null)
                setDetailOpen(true)
              }}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              지점 추가
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 sm:p-6">
            {tableData.sortedData.map((branch) => (
              <div
                key={branch.id}
                className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-neutral-900 truncate">{branch.name}</h3>
                    <p className="text-xs text-neutral-500 mt-1">코드: {branch.code}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelected(branch)
                      setDetailOpen(true)
                    }}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md border-2 border-pink-200 hover:bg-pink-100 text-pink-600 transition-colors flex-shrink-0"
                    aria-label="수정"
                    title="수정"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2 text-sm text-neutral-600">
                  {branch.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{branch.address}</span>
                    </div>
                  )}
                  {branch.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                      <span>{branch.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-neutral-200 flex items-center justify-between">
                  {branch.owner_id ? (
                    <p className="text-xs text-neutral-500">지점장 할당됨</p>
                  ) : (
                    <p className="text-xs text-neutral-500">지점장 미할당</p>
                  )}
                  <button
                    onClick={() => {
                      setSelectedBranchForInvite(branch)
                      setInviteOpen(true)
                    }}
                    className="text-xs text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1"
                    title="지점장 초대"
                  >
                    <UserPlus className="h-3 w-3" />
                    지점장 초대
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <BranchDetailModal
        open={detailOpen}
        item={selected}
        onClose={() => setDetailOpen(false)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />

      <InviteOwnerModal
        open={inviteOpen}
        onClose={() => {
          setInviteOpen(false)
          setSelectedBranchForInvite(null)
        }}
        onInvited={() => {
          load()
        }}
        branchId={selectedBranchForInvite?.id || null}
      />
    </main>
  )
}

