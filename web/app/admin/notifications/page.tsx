'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/app/components/common/PageHeader'
import Card from '@/app/components/ui/Card'
import Button from '@/app/components/ui/Button'
import Input from '@/app/components/ui/Input'
import Select from '@/app/components/ui/Select'
import { Bell, CheckCircle, XCircle, Filter } from 'lucide-react'
import { useAppToast } from '@/app/lib/ui/toast'
import { useCurrentUser } from '@/app/lib/hooks/useCurrentUser'

type NotificationSetting = {
  id: string
  user_id: string
  notification_type: string
  enabled: boolean
  channel: string
  created_at: string
  updated_at: string
}

type Notification = {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  read: boolean
  read_at: string | null
  metadata: any
  created_at: string
}

export default function NotificationsPage() {
  const router = useRouter()
  const toast = useAppToast()
  const { role, isHQ } = useCurrentUser()
  const [settings, setSettings] = useState<NotificationSetting[]>([])
  const [history, setHistory] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings')
  const [filters, setFilters] = useState({
    userId: '',
    type: '',
  })

  useEffect(() => {
    if (role && !isHQ) {
      toast.error('접근 권한이 없습니다.', '알림 관리는 본사(HQ)만 사용할 수 있습니다.')
      router.push('/dashboard')
    }
  }, [role, isHQ, router, toast])

  const loadSettings = useCallback(async () => {
    if (!isHQ) return

    try {
      setLoading(true)
      const response = await fetch('/api/admin/notifications', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('알림 설정을 불러오는데 실패했습니다.')
      }

      const data = await response.json()
      setSettings(data.settings || [])
    } catch (err) {
      console.error('Failed to load notification settings:', err)
      const errorMessage = err instanceof Error ? err.message : '알림 설정을 불러오는데 실패했습니다.'
      setError(errorMessage)
      toast.error('로드 실패', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isHQ, toast])

  const loadHistory = useCallback(async () => {
    if (!isHQ) return

    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.userId) params.set('userId', filters.userId)
      if (filters.type) params.set('type', filters.type)

      const response = await fetch(`/api/admin/notifications/history?${params.toString()}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('알림 이력을 불러오는데 실패했습니다.')
      }

      const data = await response.json()
      setHistory(data.notifications || [])
    } catch (err) {
      console.error('Failed to load notification history:', err)
      const errorMessage = err instanceof Error ? err.message : '알림 이력을 불러오는데 실패했습니다.'
      setError(errorMessage)
      toast.error('로드 실패', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isHQ, filters, toast])

  useEffect(() => {
    if (activeTab === 'settings') {
      loadSettings()
    } else {
      loadHistory()
    }
  }, [activeTab, loadSettings, loadHistory])

  if (!isHQ) {
    return null
  }

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="알림 관리"
        description="알림 설정 및 이력을 관리합니다."
      />

      <Card className="p-6">
        <div className="space-y-4">
          {/* 탭 */}
          <div className="flex gap-2 border-b border-neutral-200">
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'text-action-blue-600 border-b-2 border-action-blue-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              알림 설정
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'history'
                  ? 'text-action-blue-600 border-b-2 border-action-blue-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              알림 이력
            </button>
          </div>

          {activeTab === 'settings' ? (
            <>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action-blue-600 mx-auto"></div>
                  <p className="mt-4 text-neutral-600">로딩 중...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-600">{error}</div>
              ) : settings.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">알림 설정이 없습니다.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-neutral-900">사용자 ID</th>
                        <th className="px-4 py-3 text-left font-semibold text-neutral-900">알림 유형</th>
                        <th className="px-4 py-3 text-left font-semibold text-neutral-900">채널</th>
                        <th className="px-4 py-3 text-left font-semibold text-neutral-900">상태</th>
                        <th className="px-4 py-3 text-left font-semibold text-neutral-900">업데이트</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {settings.map((setting) => (
                        <tr key={setting.id} className="hover:bg-neutral-50">
                          <td className="px-4 py-3 text-neutral-700">{setting.user_id}</td>
                          <td className="px-4 py-3 text-neutral-700">{setting.notification_type}</td>
                          <td className="px-4 py-3 text-neutral-700">{setting.channel}</td>
                          <td className="px-4 py-3">
                            {setting.enabled ? (
                              <span className="inline-flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                활성화
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600">
                                <XCircle className="h-4 w-4" />
                                비활성화
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-neutral-600 text-xs">
                            {new Date(setting.updated_at).toLocaleString('ko-KR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <>
              {/* 필터 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="사용자 ID"
                  value={filters.userId}
                  onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                  placeholder="사용자 ID로 필터링"
                />
                <Input
                  label="알림 유형"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  placeholder="알림 유형으로 필터링"
                />
                <div className="flex items-end">
                  <Button variant="primary" onClick={loadHistory} className="w-full">
                    필터 적용
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action-blue-600 mx-auto"></div>
                  <p className="mt-4 text-neutral-600">로딩 중...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-600">{error}</div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">알림 이력이 없습니다.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-neutral-900">날짜</th>
                        <th className="px-4 py-3 text-left font-semibold text-neutral-900">사용자 ID</th>
                        <th className="px-4 py-3 text-left font-semibold text-neutral-900">유형</th>
                        <th className="px-4 py-3 text-left font-semibold text-neutral-900">제목</th>
                        <th className="px-4 py-3 text-left font-semibold text-neutral-900">메시지</th>
                        <th className="px-4 py-3 text-left font-semibold text-neutral-900">읽음</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {history.map((notif) => (
                        <tr key={notif.id} className="hover:bg-neutral-50">
                          <td className="px-4 py-3 text-neutral-700">
                            {new Date(notif.created_at).toLocaleString('ko-KR')}
                          </td>
                          <td className="px-4 py-3 text-neutral-700">{notif.user_id}</td>
                          <td className="px-4 py-3 text-neutral-700">{notif.type}</td>
                          <td className="px-4 py-3 font-medium text-neutral-900">{notif.title}</td>
                          <td className="px-4 py-3 text-neutral-600">{notif.message}</td>
                          <td className="px-4 py-3">
                            {notif.read ? (
                              <span className="inline-flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                읽음
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-600">
                                <XCircle className="h-4 w-4" />
                                미읽음
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </main>
  )
}

