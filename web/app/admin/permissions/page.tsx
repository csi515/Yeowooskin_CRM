'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/app/components/common/PageHeader'
import Card from '@/app/components/ui/Card'
import Button from '@/app/components/ui/Button'
import Select from '@/app/components/ui/Select'
import { Shield, CheckCircle, XCircle } from 'lucide-react'
import { useAppToast } from '@/app/lib/ui/toast'
import { useCurrentUser } from '@/app/lib/hooks/useCurrentUser'

type Permission = {
  id: string
  role: 'HQ' | 'OWNER' | 'STAFF'
  resource: string
  action: string
  granted: boolean
  created_at: string
  updated_at: string
}

const RESOURCES = ['customers', 'appointments', 'finance', 'branches', 'users', 'products', 'settings']
const ACTIONS = ['read', 'write', 'delete', 'manage']

export default function PermissionsPage() {
  const router = useRouter()
  const toast = useAppToast()
  const { role, isHQ } = useCurrentUser()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState<'HQ' | 'OWNER' | 'STAFF' | 'all'>('all')

  useEffect(() => {
    if (role && !isHQ) {
      toast.error('접근 권한이 없습니다.', '권한 관리는 본사(HQ)만 사용할 수 있습니다.')
      router.push('/dashboard')
    }
  }, [role, isHQ, router, toast])

  const loadPermissions = useCallback(async () => {
    if (!isHQ) return

    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()
      if (selectedRole !== 'all') {
        params.set('role', selectedRole)
      }

      const response = await fetch(`/api/admin/permissions?${params.toString()}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('권한 목록을 불러오는데 실패했습니다.')
      }

      const data = await response.json()
      setPermissions(data.permissions || [])
    } catch (err) {
      console.error('Failed to load permissions:', err)
      const errorMessage = err instanceof Error ? err.message : '권한 목록을 불러오는데 실패했습니다.'
      setError(errorMessage)
      toast.error('로드 실패', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isHQ, selectedRole, toast])

  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  const togglePermission = async (perm: Permission) => {
    try {
      setSaving(perm.id)
      const response = await fetch('/api/admin/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: perm.role,
          resource: perm.resource,
          action: perm.action,
          granted: !perm.granted,
        }),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('권한 업데이트에 실패했습니다.')
      }

      toast.success('권한이 업데이트되었습니다.')
      loadPermissions()
    } catch (err) {
      console.error('Failed to update permission:', err)
      const errorMessage = err instanceof Error ? err.message : '권한 업데이트에 실패했습니다.'
      toast.error('업데이트 실패', errorMessage)
    } finally {
      setSaving(null)
    }
  }

  const getPermission = (role: string, resource: string, action: string) => {
    return permissions.find(
      p => p.role === role && p.resource === resource && p.action === action
    )
  }

  if (!isHQ) {
    return null
  }

  const roles: ('HQ' | 'OWNER' | 'STAFF')[] = ['HQ', 'OWNER', 'STAFF']
  const filteredRoles = selectedRole === 'all' ? roles : [selectedRole]

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="권한 관리"
        description="역할별 리소스 접근 권한을 관리합니다."
      />

      <Card className="p-6">
        <div className="space-y-4">
          {/* 역할 필터 */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-neutral-700">역할 필터:</label>
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              options={[
                { value: 'all', label: '전체' },
                { value: 'HQ', label: '본사' },
                { value: 'OWNER', label: '점주' },
                { value: 'STAFF', label: '직원' },
              ]}
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action-blue-600 mx-auto"></div>
              <p className="mt-4 text-neutral-600">로딩 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : (
            <div className="space-y-6">
              {filteredRoles.map((role) => (
                <div key={role} className="border border-neutral-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {role === 'HQ' ? '본사' : role === 'OWNER' ? '점주' : '직원'}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-neutral-900">리소스</th>
                          {ACTIONS.map((action) => (
                            <th key={action} className="px-4 py-2 text-center font-semibold text-neutral-900">
                              {action === 'read' ? '조회' : action === 'write' ? '작성' : action === 'delete' ? '삭제' : '관리'}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {RESOURCES.map((resource) => (
                          <tr key={resource} className="hover:bg-neutral-50">
                            <td className="px-4 py-3 font-medium text-neutral-900">
                              {resource === 'customers' ? '고객' :
                               resource === 'appointments' ? '예약' :
                               resource === 'finance' ? '재무' :
                               resource === 'branches' ? '지점' :
                               resource === 'users' ? '사용자' :
                               resource === 'products' ? '제품' :
                               resource === 'settings' ? '설정' : resource}
                            </td>
                            {ACTIONS.map((action) => {
                              const perm = getPermission(role, resource, action)
                              const granted = perm?.granted ?? false
                              return (
                                <td key={action} className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => perm && togglePermission(perm)}
                                    disabled={!perm || saving === perm.id}
                                    className={`inline-flex items-center justify-center w-8 h-8 rounded transition-colors ${
                                      granted
                                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                        : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  >
                                    {granted ? (
                                      <CheckCircle className="h-4 w-4" />
                                    ) : (
                                      <XCircle className="h-4 w-4" />
                                    )}
                                  </button>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </main>
  )
}

