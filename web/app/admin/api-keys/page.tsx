'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/app/components/common/PageHeader'
import Card from '@/app/components/ui/Card'
import Button from '@/app/components/ui/Button'
import Input from '@/app/components/ui/Input'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/app/components/ui/Modal'
import { Key, Plus, Trash2, Eye, EyeOff, Copy, CheckCircle } from 'lucide-react'
import { useAppToast } from '@/app/lib/ui/toast'
import { useCurrentUser } from '@/app/lib/hooks/useCurrentUser'

type ApiKey = {
  id: string
  name: string
  created_by: string | null
  permissions: string[]
  last_used_at: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  api_key?: string // 생성 시에만 포함
}

export default function ApiKeysPage() {
  const router = useRouter()
  const toast = useAppToast()
  const { role, isHQ } = useCurrentUser()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([])
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (role && !isHQ) {
      toast.error('접근 권한이 없습니다.', 'API 키 관리는 본사(HQ)만 사용할 수 있습니다.')
      router.push('/dashboard')
    }
  }, [role, isHQ, router, toast])

  const loadKeys = useCallback(async () => {
    if (!isHQ) return

    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/admin/api-keys', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('API 키 목록을 불러오는데 실패했습니다.')
      }

      const data = await response.json()
      setKeys(data.keys || [])
    } catch (err) {
      console.error('Failed to load API keys:', err)
      const errorMessage = err instanceof Error ? err.message : 'API 키 목록을 불러오는데 실패했습니다.'
      setError(errorMessage)
      toast.error('로드 실패', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isHQ, toast])

  useEffect(() => {
    loadKeys()
  }, [loadKeys])

  const createKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('이름을 입력하세요.')
      return
    }

    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          permissions: newKeyPermissions,
        }),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('API 키 생성에 실패했습니다.')
      }

      const data = await response.json()
      setCreatedKey(data.key.api_key)
      toast.success('API 키가 생성되었습니다. 안전한 곳에 저장하세요.')
      setNewKeyName('')
      setNewKeyPermissions([])
      loadKeys()
    } catch (err) {
      console.error('Failed to create API key:', err)
      const errorMessage = err instanceof Error ? err.message : 'API 키 생성에 실패했습니다.'
      toast.error('생성 실패', errorMessage)
    }
  }

  const deleteKey = async (id: string) => {
    if (!confirm('정말 이 API 키를 비활성화하시겠습니까?')) return

    try {
      const response = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('API 키 삭제에 실패했습니다.')
      }

      toast.success('API 키가 비활성화되었습니다.')
      loadKeys()
    } catch (err) {
      console.error('Failed to delete API key:', err)
      const errorMessage = err instanceof Error ? err.message : 'API 키 삭제에 실패했습니다.'
      toast.error('삭제 실패', errorMessage)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('클립보드에 복사되었습니다.')
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isHQ) {
    return null
  }

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="API 키 관리"
        description="외부 연동을 위한 API 키를 생성하고 관리합니다."
      />

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">API 키 목록</h3>
              <p className="text-sm text-neutral-600">API 키를 생성하고 관리할 수 있습니다.</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setCreateModalOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              키 생성
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action-blue-600 mx-auto"></div>
              <p className="mt-4 text-neutral-600">로딩 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : keys.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">API 키가 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">이름</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">권한</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">상태</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">마지막 사용</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">만료일</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">생성일</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">동작</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {keys.map((key) => (
                    <tr key={key.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-900">{key.name}</td>
                      <td className="px-4 py-3 text-neutral-700">
                        {key.permissions.length > 0 ? key.permissions.join(', ') : '없음'}
                      </td>
                      <td className="px-4 py-3">
                        {key.is_active ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            활성
                          </span>
                        ) : (
                          <span className="text-neutral-400">비활성</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 text-xs">
                        {key.last_used_at ? new Date(key.last_used_at).toLocaleString('ko-KR') : '사용 안 함'}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 text-xs">
                        {key.expires_at ? new Date(key.expires_at).toLocaleDateString('ko-KR') : '만료 없음'}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 text-xs">
                        {new Date(key.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => deleteKey(key.id)}
                          leftIcon={<Trash2 className="h-4 w-4" />}
                        >
                          삭제
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* 생성 모달 */}
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} size="md">
        <ModalHeader title="API 키 생성" />
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="키 이름"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="예: 프로덕션 API 키"
            />
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">권한</label>
              <p className="text-xs text-neutral-500 mb-2">권한 설정은 추후 구현 예정입니다.</p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
            취소
          </Button>
          <Button variant="primary" onClick={createKey}>
            생성
          </Button>
        </ModalFooter>
      </Modal>

      {/* 생성된 키 표시 모달 */}
      <Modal open={!!createdKey} onClose={() => setCreatedKey(null)} size="md">
        <ModalHeader title="API 키 생성 완료" />
        <ModalBody>
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800 font-medium mb-2">⚠️ 중요</p>
              <p className="text-sm text-amber-700">
                이 API 키는 지금 한 번만 표시됩니다. 안전한 곳에 저장하세요. 다시 확인할 수 없습니다.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">API 키</label>
              <div className="flex items-center gap-2">
                <Input
                  value={createdKey || ''}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => createdKey && copyToClipboard(createdKey)}
                  leftIcon={copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                >
                  {copied ? '복사됨' : '복사'}
                </Button>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={() => setCreatedKey(null)}>
            확인
          </Button>
        </ModalFooter>
      </Modal>
    </main>
  )
}

