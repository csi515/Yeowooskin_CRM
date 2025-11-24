'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Save } from 'lucide-react'
import { useAppToast } from '@/app/lib/ui/toast'
import { settingsApi } from '@/app/lib/api/settings'
import { DEFAULT_SETTINGS, type AppSettings } from '@/types/settings'
import Card from '@/app/components/ui/Card'
import Button from '@/app/components/ui/Button'
import { Skeleton } from '@/app/components/ui/Skeleton'
// 탭 컴포넌트는 직접 구현하여 반응형 디자인 적용
// 설정 섹션 컴포넌트들 (탭별로 분리)
import BusinessProfileSection from '@/app/components/settings/BusinessProfileSection'
import BookingSettingsSection from '@/app/components/settings/BookingSettingsSection'
import FinancialSettingsSection from '@/app/components/settings/FinancialSettingsSection'
import SystemSettingsSection from '@/app/components/settings/SystemSettingsSection'
import AccountSettingsSection from '@/app/components/settings/AccountSettingsSection'
import { createAuthenticatedPage } from '@/app/lib/hocs/createProtectedPage'
import { useCurrentUser } from '@/app/lib/hooks/useCurrentUser'

type SettingsTab = 'baseInfo' | 'reservations' | 'financials' | 'systemSecurity' | 'franchiseAdmin'

function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState<SettingsTab>('baseInfo')
  const toast = useAppToast()
  const toastRef = useRef(toast)
  const { role, isHQ, isOwner } = useCurrentUser()
  
  // toast ref 업데이트
  useEffect(() => {
    toastRef.current = toast
  }, [toast])

  // 탭별 표시 가능 여부
  const getAvailableTabs = useCallback((): { id: SettingsTab; label: string; icon: string }[] => {
    const tabs = [
      { id: 'baseInfo' as SettingsTab, label: '가게 정보', icon: '🏪' }
    ]

    if (isHQ || isOwner) {
      tabs.push(
        { id: 'reservations' as SettingsTab, label: '예약 설정', icon: '📅' },
        { id: 'financials' as SettingsTab, label: '재무 설정', icon: '💰' }
      )
    }

    tabs.push({ id: 'systemSecurity' as SettingsTab, label: '시스템·보안', icon: '🔒' })

    if (isHQ || isOwner) {
      tabs.push({ id: 'franchiseAdmin' as SettingsTab, label: '프랜차이즈 관리', icon: '👥' })
    }

    return tabs
  }, [isHQ, isOwner])

  const availableTabs = getAvailableTabs()

  // 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        const data = await settingsApi.get()
        setSettings(data)
      } catch (error) {
        console.error('설정 로드 실패:', error)
        toastRef.current.error('설정을 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 탭별 저장 가능 여부 확인
  const canSaveTab = useCallback((tab: SettingsTab): boolean => {
    switch (tab) {
      case 'baseInfo':
      case 'reservations':
      case 'financials':
      case 'systemSecurity':
        return isHQ || isOwner
      case 'franchiseAdmin':
        return isHQ || isOwner
      default:
        return false
    }
  }, [isHQ, isOwner])

  // 설정 저장
  const handleSave = useCallback(async () => {
    if (!hasChanges) return

    try {
      setSaving(true)
      await settingsApi.update({
        businessProfile: settings.businessProfile,
        bookingSettings: settings.bookingSettings,
        financialSettings: settings.financialSettings,
        systemSettings: settings.systemSettings,
      })
      setHasChanges(false)
      toastRef.current.success('설정이 저장되었습니다.', {
        description: '변경사항이 모든 기기에 반영됩니다.',
        duration: 4000,
      })
    } catch (error) {
      console.error('설정 저장 실패:', error)
      toastRef.current.error('설정 저장에 실패했습니다.', {
        description: '네트워크 연결을 확인하고 다시 시도해주세요.',
        duration: 5000,
      })
    } finally {
      setSaving(false)
    }
  }, [settings.businessProfile, settings.bookingSettings, settings.financialSettings, settings.systemSettings, hasChanges])

  // 섹션별 onChange 핸들러 메모이제이션
  const handleBusinessProfileChange = useCallback((data: Partial<typeof settings.businessProfile>) => {
    setSettings((s) => ({ ...s, businessProfile: { ...s.businessProfile, ...data } }))
    setHasChanges(true)
  }, [])

  const handleBookingSettingsChange = useCallback((data: Partial<typeof settings.bookingSettings>) => {
    setSettings((s) => ({ ...s, bookingSettings: { ...s.bookingSettings, ...data } }))
    setHasChanges(true)
  }, [])

  const handleFinancialSettingsChange = useCallback((data: Partial<typeof settings.financialSettings>) => {
    setSettings((s) => ({ ...s, financialSettings: { ...s.financialSettings, ...data } }))
    setHasChanges(true)
  }, [])

  const handleSystemSettingsChange = useCallback((data: Partial<typeof settings.systemSettings>) => {
    setSettings((s) => ({ ...s, systemSettings: { ...s.systemSettings, ...data } }))
    setHasChanges(true)
  }, [])

  if (loading) {
    return (
      <main className="space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">설정</h1>
        </div>
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-24 flex-shrink-0" />
          ))}
        </div>
        <Card>
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </Card>
      </main>
    )
  }

  return (
    <main className="space-y-6 pb-24 safe-area-inset-bottom">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">설정</h1>
          <p className="text-sm text-neutral-600 mt-1">시스템 설정 및 환경 구성을 관리하세요</p>
        </div>
      </div>

      {/* 탭 네비게이션 - 반응형 디자인 */}
      <div className="sticky top-0 z-40 bg-white border-b border-neutral-200 pb-4">
        <div className="flex overflow-x-auto scrollbar-hide gap-2 py-2">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap
                transition-all duration-200 flex-shrink-0 min-w-0
                ${activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-lg transform scale-105'
                  : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
                }
                touch-manipulation
              `}
            >
              <span className="text-base">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* 현재 탭 설명 */}
        <div className="mt-3 text-sm text-neutral-600">
          {activeTab === 'baseInfo' && '가게 기본 정보 및 연락처를 설정하세요'}
          {activeTab === 'reservations' && '예약 시스템 설정 및 정책을 관리하세요'}
          {activeTab === 'financials' && '재무 관련 설정 및 비용 항목을 관리하세요'}
          {activeTab === 'systemSecurity' && '시스템 보안 및 알림 설정을 관리하세요'}
          {activeTab === 'franchiseAdmin' && '프랜차이즈 운영 및 권한 설정을 관리하세요'}
        </div>
      </div>

      {/* 저장 버튼 (Floating) - 설정 관련 탭에서만 표시 */}
      {(activeTab === 'baseInfo' || activeTab === 'reservations' || activeTab === 'financials' || activeTab === 'systemSecurity') && canSaveTab(activeTab) && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 safe-area-inset-x safe-area-inset-bottom">
          <Button
            variant="primary"
            size="lg"
            leftIcon={<Save className="h-5 w-5" />}
            onClick={handleSave}
            disabled={saving || !hasChanges}
            loading={saving}
            className="shadow-xl rounded-2xl px-6 py-3 min-h-[48px] touch-manipulation"
          >
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      )}

      {/* 탭 컨텐츠 */}
      <div className="space-y-6">
        {activeTab === 'baseInfo' && (
          <BusinessProfileSection
            data={settings.businessProfile}
            onChange={handleBusinessProfileChange}
          />
        )}

        {activeTab === 'reservations' && (isHQ || isOwner) && (
          <BookingSettingsSection
            data={settings.bookingSettings}
            onChange={handleBookingSettingsChange}
          />
        )}

        {activeTab === 'financials' && (isHQ || isOwner) && (
          <FinancialSettingsSection
            data={settings.financialSettings}
            onChange={handleFinancialSettingsChange}
          />
        )}

        {activeTab === 'systemSecurity' && (
          <SystemSettingsSection
            data={settings.systemSettings}
            onChange={handleSystemSettingsChange}
          />
        )}

        {activeTab === 'franchiseAdmin' && (isHQ || isOwner) && (
          <Card className="p-6">
            <div className="text-center py-12">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">프랜차이즈 관리</h3>
              <p className="text-neutral-600 mb-6">직원 권한 설정 및 매장 관리를 위한 기능입니다.</p>
              <div className="space-y-3">
                <Button variant="outline" className="w-full sm:w-auto">
                  직원 권한 설정
                </Button>
                <Button variant="outline" className="w-full sm:w-auto ml-0 sm:ml-3">
                  매장별 권한 부여
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </main>
  )
}

export default createAuthenticatedPage(SettingsPage)