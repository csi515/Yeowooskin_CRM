'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/app/components/common/PageHeader'
import LoadingState from '@/app/components/common/LoadingState'
import ErrorState from '@/app/components/common/ErrorState'
import Card from '@/app/components/ui/Card'
import Button from '@/app/components/ui/Button'
import Input from '@/app/components/ui/Input'
import Select from '@/app/components/ui/Select'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/app/components/ui/Modal'
import { Users, Search, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { useAppToast } from '@/app/lib/ui/toast'
import { useCurrentUser } from '@/app/lib/hooks/useCurrentUser'
import { usersApi, type UserUpdateInput } from '@/app/lib/api/users'
import { branchApi } from '@/app/lib/api/branches'
import type { Profile, Branch } from '@/types/entities'
import { useTableData } from '@/app/lib/hooks/useTableData'

type UserWithBranch = Profile & {
  branches?: {
    id: string
    name: string
    code: string
  } | null
}

export default function UsersPage() {
  const router = useRouter()
  const toast = useAppToast()
  const { role, isHQ } = useCurrentUser()
  const [users, setUsers] = useState<UserWithBranch[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithBranch | null>(null)
  const [editForm, setEditForm] = useState<UserUpdateInput>({})

  // HQ 권한 확인
  useEffect(() => {
    if (role && !isHQ) {
      toast.error('접근 권한이 없습니다.', '사용자 관리는 본사(HQ)만 사용할 수 있습니다.')
      router.push('/dashboard')
    }
  }, [role, isHQ, router, toast])

  // 테이블 데이터 훅
  const tableData = useTableData<UserWithBranch>({
    data: users,
    searchOptions: {
      debounceMs: 300,
      searchFields: ['email', 'name', 'phone'],
    },
    sortOptions: {
      initialKey: 'created_at',
      initialDirection: 'desc',
    },
  })

  // 사용자 목록 로드
  const load = useCallback(async () => {
    if (!isHQ) return

    try {
      setLoading(true)
      setError('')

      const response = await usersApi.list({
        search: tableData.debouncedQuery,
        limit: 100,
      })
      setUsers(response.users)
    } catch (err) {
      console.error('Failed to load users:', err)
      const errorMessage = err instanceof Error ? err.message : '사용자 목록을 불러오는데 실패했습니다.'
      setError(errorMessage)
      toast.error('로드 실패', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [tableData.debouncedQuery, isHQ, toast])

  // 지점 목록 로드
  const loadBranches = useCallback(async () => {
    if (!isHQ) return

    try {
      const data = await branchApi.list({ limit: 100 })
      setBranches(data)
    } catch (err) {
      console.error('Failed to load branches:', err)
    }
  }, [isHQ])

  useEffect(() => {
    load()
    loadBranches()
  }, [load, loadBranches])

  // 사용자 수정 모달 열기
  const handleEdit = (user: UserWithBranch) => {
    setSelectedUser(user)
    setEditForm({
      role: user.role,
      branch_id: user.branch_id || null,
      approved: user.approved,
    })
    setEditModalOpen(true)
  }

  // 사용자 정보 수정
  const handleUpdate = async () => {
    if (!selectedUser) return

    try {
      // 역할이 변경된 경우 역할 변경 API 사용
      if (editForm.role && editForm.role !== selectedUser.role) {
        await usersApi.updateRole(selectedUser.id, editForm.role, editForm.branch_id)
      } else {
        // 역할이 변경되지 않은 경우 일반 업데이트
        await usersApi.update(selectedUser.id, editForm)
      }
      toast.success('사용자 정보가 수정되었습니다.')
      setEditModalOpen(false)
      load()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '수정 실패'
      toast.error('수정 실패', errorMessage)
    }
  }

  // 사용자 삭제 (비활성화)
  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`정말 ${email} 사용자를 비활성화하시겠습니까?`)) return

    try {
      await usersApi.delete(id)
      toast.success('사용자가 비활성화되었습니다.')
      load()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '삭제 실패'
      toast.error('삭제 실패', errorMessage)
    }
  }

  if (role && !isHQ) {
    return null
  }

  return (
    <main className="space-y-4 sm:space-y-5 md:space-y-6">
      <PageHeader
        title="사용자 관리"
        description="전체 사용자를 조회하고 관리할 수 있습니다."
      />

      {/* 검색 */}
      <Card className="p-4 sm:p-5">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="이메일, 이름, 전화번호로 검색..."
              value={tableData.query}
              onChange={(e) => tableData.setQuery(e.target.value)}
              leftIcon={<Search className="h-5 w-5 text-neutral-400" />}
            />
          </div>
        </div>
      </Card>

      {error && <ErrorState title="오류 발생" message={error} onRetry={load} />}

      {/* 사용자 목록 */}
      {loading ? (
        <LoadingState rows={6} variant="table" />
      ) : users.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-500">사용자가 없습니다.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-900">이메일</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-900">이름</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-900">역할</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-900">지점</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-900">상태</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-900">가입일</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-900">동작</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {tableData.sortedData.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-neutral-900">{user.email}</td>
                    <td className="px-4 py-3 text-neutral-700">{user.name || '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'HQ'
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'OWNER'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.role === 'HQ' ? '본사' : user.role === 'OWNER' ? '점주' : '직원'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {user.branches ? (
                        <div>
                          <div className="font-medium">{user.branches.name}</div>
                          <div className="text-xs text-neutral-500">{user.branches.code}</div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.approved ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-xs">승인됨</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-600">
                          <XCircle className="h-4 w-4" />
                          <span className="text-xs">대기 중</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 text-xs">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString('ko-KR')
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {user.role !== 'HQ' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(user.id, user.email)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 수정 모달 */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} size="md">
        <ModalHeader
          title="사용자 정보 수정"
          description="사용자의 역할, 지점, 승인 상태를 변경할 수 있습니다."
        />
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">역할</label>
              <Select
                value={editForm.role || ''}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'HQ' | 'OWNER' | 'STAFF' })}
              >
                <option value="HQ">본사 (HQ)</option>
                <option value="OWNER">점주 (OWNER)</option>
                <option value="STAFF">직원 (STAFF)</option>
              </Select>
            </div>

            {editForm.role !== 'HQ' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">지점</label>
                <Select
                  value={editForm.branch_id || ''}
                  onChange={(e) => setEditForm({ ...editForm, branch_id: e.target.value || null })}
                >
                  <option value="">지점 없음</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.code})
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.approved || false}
                  onChange={(e) => setEditForm({ ...editForm, approved: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 text-pink-600"
                />
                <span className="text-sm text-neutral-700">승인됨</span>
              </label>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
            취소
          </Button>
          <Button variant="primary" onClick={handleUpdate}>
            저장
          </Button>
        </ModalFooter>
      </Modal>
    </main>
  )
}

