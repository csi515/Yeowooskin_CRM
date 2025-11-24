'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/app/components/common/PageHeader'
import Card from '@/app/components/ui/Card'
import Button from '@/app/components/ui/Button'
import { Database, Download, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useAppToast } from '@/app/lib/ui/toast'
import { useCurrentUser } from '@/app/lib/hooks/useCurrentUser'

type Backup = {
  id: string
  backup_type: string
  file_path: string | null
  file_size: number | null
  status: string
  created_by: string | null
  completed_at: string | null
  error_message: string | null
  created_at: string
}

export default function BackupPage() {
  const router = useRouter()
  const toast = useAppToast()
  const { role, isHQ } = useCurrentUser()
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (role && !isHQ) {
      toast.error('접근 권한이 없습니다.', '백업 관리는 본사(HQ)만 사용할 수 있습니다.')
      router.push('/dashboard')
    }
  }, [role, isHQ, router, toast])

  const loadBackups = useCallback(async () => {
    if (!isHQ) return

    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/admin/backup', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('백업 이력을 불러오는데 실패했습니다.')
      }

      const data = await response.json()
      setBackups(data.backups || [])
    } catch (err) {
      console.error('Failed to load backups:', err)
      const errorMessage = err instanceof Error ? err.message : '백업 이력을 불러오는데 실패했습니다.'
      setError(errorMessage)
      toast.error('로드 실패', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isHQ, toast])

  useEffect(() => {
    loadBackups()
  }, [loadBackups])

  const createBackup = async () => {
    if (!confirm('백업을 생성하시겠습니까?')) return

    try {
      setCreating(true)
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupType: 'manual' }),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('백업 생성에 실패했습니다.')
      }

      toast.success('백업이 생성되었습니다.')
      loadBackups()
    } catch (err) {
      console.error('Failed to create backup:', err)
      const errorMessage = err instanceof Error ? err.message : '백업 생성에 실패했습니다.'
      toast.error('백업 실패', errorMessage)
    } finally {
      setCreating(false)
    }
  }

  if (!isHQ) {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-neutral-400" />
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="데이터 백업 및 복원"
        description="시스템 데이터를 백업하고 복원합니다."
      />

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">백업 관리</h3>
              <p className="text-sm text-neutral-600">수동으로 백업을 생성하거나 백업 이력을 조회할 수 있습니다.</p>
            </div>
            <Button
              variant="primary"
              onClick={createBackup}
              loading={creating}
              disabled={creating}
              leftIcon={<Database className="h-4 w-4" />}
            >
              백업 생성
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action-blue-600 mx-auto"></div>
              <p className="mt-4 text-neutral-600">로딩 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : backups.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">백업 이력이 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">생성일</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">유형</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">상태</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">파일 경로</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">파일 크기</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">완료일</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">동작</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {backups.map((backup) => (
                    <tr key={backup.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 text-neutral-700">
                        {new Date(backup.created_at).toLocaleString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        {backup.backup_type === 'manual' ? '수동' : backup.backup_type === 'full' ? '전체' : '증분'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(backup.status)}
                          <span className="text-sm">
                            {backup.status === 'completed' ? '완료' : backup.status === 'failed' ? '실패' : '대기 중'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{backup.file_path || '-'}</td>
                      <td className="px-4 py-3 text-neutral-700">{formatFileSize(backup.file_size)}</td>
                      <td className="px-4 py-3 text-neutral-600 text-xs">
                        {backup.completed_at ? new Date(backup.completed_at).toLocaleString('ko-KR') : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {backup.status === 'completed' && backup.file_path && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Download className="h-4 w-4" />}
                            onClick={() => {
                              // TODO: 실제 다운로드 구현
                              toast.info('다운로드 기능은 준비 중입니다.')
                            }}
                          >
                            다운로드
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </main>
  )
}

