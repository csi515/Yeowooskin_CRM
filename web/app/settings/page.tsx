'use client'

import { useEffect, useState } from 'react'
import { useAppToast } from '@/app/lib/ui/toast'
import { settingsApi } from '@/app/lib/api/settings'
import { DEFAULT_SETTINGS, type AppSettings, type FinancialSettings, type StaffSettings, type BusinessProfile, type BookingSettings } from '@/types/settings'
import Card from '@/app/components/ui/Card'
import { Skeleton } from '@/app/components/ui/Skeleton'

// Summary Cards
import BusinessProfileSummaryCard from '@/app/components/settings/cards/BusinessProfileSummaryCard'
import BookingSettingsSummaryCard from '@/app/components/settings/cards/BookingSettingsSummaryCard'
import FinancialSettingsSummaryCard from '@/app/components/settings/cards/FinancialSettingsSummaryCard'
import StaffSettingsSummaryCard from '@/app/components/settings/cards/StaffSettingsSummaryCard'

// Modals
import BusinessProfileModal from '@/app/components/settings/modals/BusinessProfileModal'
import BookingSettingsModal from '@/app/components/settings/modals/BookingSettingsModal'
import FinancialSettingsModal from '@/app/components/settings/modals/FinancialSettingsModal'
import StaffSettingsModal from '@/app/components/settings/modals/StaffSettingsModal'

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  // Modal states
  const [businessModalOpen, setBusinessModalOpen] = useState(false)
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [financialModalOpen, setFinancialModalOpen] = useState(false)
  const [staffModalOpen, setStaffModalOpen] = useState(false)

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

  // 가게 정보 저장
  const handleSaveBusinessProfile = async (data: BusinessProfile) => {
    try {
      await settingsApi.update({ businessProfile: data })
      setSettings((s) => ({ ...s, businessProfile: data }))
      toast.success('가게 정보가 저장되었습니다.')
    } catch (error) {
      console.error('가게 정보 저장 실패:', error)
      toast.error('가게 정보 저장에 실패했습니다.', error instanceof Error ? error.message : '알 수 없는 오류')
    }
  }

  // 예약 설정 저장
  const handleSaveBookingSettings = async (data: BookingSettings) => {
    try {
      await settingsApi.update({ bookingSettings: data })
      setSettings((s) => ({ ...s, bookingSettings: data }))
      toast.success('예약 설정이 저장되었습니다.')
    } catch (error) {
      console.error('예약 설정 저장 실패:', error)
      toast.error('예약 설정 저장에 실패했습니다.', error instanceof Error ? error.message : '알 수 없는 오류')
    }
  }

  // 재무 설정 저장
  const handleSaveFinancialSettings = async (data: FinancialSettings) => {
    try {
      await settingsApi.update({ financialSettings: data })
      setSettings((s) => ({ ...s, financialSettings: data }))
      toast.success('재무 설정이 저장되었습니다.')
    } catch (error) {
      console.error('재무 설정 저장 실패:', error)
      toast.error('재무 설정 저장에 실패했습니다.', error instanceof Error ? error.message : '알 수 없는 오류')
    }
  }

  // 직원 직책 설정 저장
  const handleSaveStaffSettings = async (data: StaffSettings) => {
    try {
      await settingsApi.update({ staffSettings: data })
      setSettings((s) => ({ ...s, staffSettings: data }))
      toast.success('직원 직책 설정이 저장되었습니다.')
    } catch (error) {
      console.error('직원 직책 설정 저장 실패:', error)
      toast.error('직원 직책 설정 저장에 실패했습니다.', error instanceof Error ? error.message : '알 수 없는 오류')
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
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-24">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">설정</h1>
        <p className="text-sm text-neutral-600 mt-2">
          각 설정 카드의 편집 버튼을 클릭하여 수정하세요.
        </p>
      </div>

      {/* 요약 카드들 */}
      <BusinessProfileSummaryCard
        data={settings.businessProfile}
        onEdit={() => setBusinessModalOpen(true)}
      />

      <BookingSettingsSummaryCard
        data={settings.bookingSettings}
        onEdit={() => setBookingModalOpen(true)}
      />

      <FinancialSettingsSummaryCard
        data={settings.financialSettings}
        onEdit={() => setFinancialModalOpen(true)}
      />

      <StaffSettingsSummaryCard
        data={settings.staffSettings}
        onEdit={() => setStaffModalOpen(true)}
      />

      {/* 모달들 */}
      <BusinessProfileModal
        open={businessModalOpen}
        data={settings.businessProfile}
        onClose={() => setBusinessModalOpen(false)}
        onSave={handleSaveBusinessProfile}
      />

      <BookingSettingsModal
        open={bookingModalOpen}
        data={settings.bookingSettings}
        onClose={() => setBookingModalOpen(false)}
        onSave={handleSaveBookingSettings}
      />

      <FinancialSettingsModal
        open={financialModalOpen}
        data={settings.financialSettings}
        onClose={() => setFinancialModalOpen(false)}
        onSave={handleSaveFinancialSettings}
      />

      <StaffSettingsModal
        open={staffModalOpen}
        data={settings.staffSettings}
        onClose={() => setStaffModalOpen(false)}
        onSave={handleSaveStaffSettings}
      />
    </main>
  )
}
