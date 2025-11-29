'use client'

import { useEffect, useState } from 'react'
import { Save, Sparkles } from 'lucide-react'
import { useAppToast } from '@/app/lib/ui/toast'
import { settingsApi } from '@/app/lib/api/settings'
import { DEFAULT_SETTINGS, type AppSettings } from '@/types/settings'
import Card from '@/app/components/ui/Card'
import Button from '@/app/components/ui/Button'
import { Skeleton } from '@/app/components/ui/Skeleton'
import BusinessProfileSection from '@/app/components/settings/BusinessProfileSection'
import BookingSettingsSection from '@/app/components/settings/BookingSettingsSection'
import FinancialSettingsSection from '@/app/components/settings/FinancialSettingsSection'
import SystemSettingsSection from '@/app/components/settings/SystemSettingsSection'
import clsx from 'clsx'

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const toast = useAppToast()

  // 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        const data = await settingsApi.get()
        setSettings(data)
      } catch (error) {
        console.error('설정 로드 실패:', error)
        toast.error('설정을 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 설정 저장 성공 애니메이션
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 2000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [saveSuccess])

  // 설정 저장
  const handleSave = async () => {
    try {
      setSaving(true)
      await settingsApi.update({
        businessProfile: settings.businessProfile,
        bookingSettings: settings.bookingSettings,
        financialSettings: settings.financialSettings,
        systemSettings: settings.systemSettings,
      })
      setHasChanges(false)
      setSaveSuccess(true)
      toast.success('설정이 저장되었습니다.')
    } catch (error) {
      console.error('설정 저장 실패:', error)
      toast.error('설정 저장에 실패했습니다.', error instanceof Error ? error.message : '알 수 없는 오류')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">설정</h1>
            <p className="text-sm text-neutral-600 mt-1">앱의 모든 설정을 관리합니다.</p>
          </div>
        </div>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-64 w-full" />
          </Card>
        ))}
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-32 safe-area-inset-bottom">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">설정</h1>
          <p className="text-sm text-neutral-600 mt-2">
            앱의 모든 설정을 한 곳에서 관리하세요.
          </p>
        </div>
        {hasChanges && (
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
            <Sparkles className="h-4 w-4" />
            <span className="font-medium">저장되지 않은 변경사항이 있습니다</span>
          </div>
        )}
      </div>

      {/* 저장 버튼 (Floating) */}
      <div
        className={clsx(
          'fixed bottom-6 right-6 z-50 safe-area-inset-x safe-area-inset-bottom transition-all duration-300',
          hasChanges ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
        )}
      >
        <Button
          variant="primary"
          size="lg"
          leftIcon={<Save className="h-5 w-5" />}
          onClick={handleSave}
          disabled={saving || !hasChanges}
          loading={saving}
          className={clsx(
            'shadow-2xl rounded-2xl px-6 py-3.5 min-h-[56px] touch-manipulation',
            'transform transition-all duration-300',
            saveSuccess && 'animate-bounce',
            hasChanges && 'animate-pulse'
          )}
        >
          <span className="flex items-center gap-2">
            {saving ? '저장 중...' : saveSuccess ? '저장 완료!' : '저장'}
            {hasChanges && !saving && !saveSuccess && (
              <span className="ml-1 px-2 py-0.5 bg-white/30 rounded-full text-xs font-bold">
                변경됨
              </span>
            )}
          </span>
        </Button>
      </div>

      {/* 섹션들 */}
      <BusinessProfileSection
        data={settings.businessProfile}
        onChange={(data) => {
          setSettings((s) => ({ ...s, businessProfile: { ...s.businessProfile, ...data } }))
          setHasChanges(true)
        }}
      />

      <BookingSettingsSection
        data={settings.bookingSettings}
        onChange={(data) => {
          setSettings((s) => ({ ...s, bookingSettings: { ...s.bookingSettings, ...data } }))
          setHasChanges(true)
        }}
      />

      <FinancialSettingsSection
        data={settings.financialSettings}
        onChange={(data) => {
          setSettings((s) => ({ ...s, financialSettings: { ...s.financialSettings, ...data } }))
          setHasChanges(true)
        }}
      />

      <SystemSettingsSection
        data={settings.systemSettings}
        onChange={(data) => {
          setSettings((s) => ({ ...s, systemSettings: { ...s.systemSettings, ...data } }))
          setHasChanges(true)
        }}
      />
    </main>
  )
}
