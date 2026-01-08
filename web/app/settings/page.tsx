'use client'

import { useEffect, useState } from 'react'
import { useAppToast } from '@/app/lib/ui/toast'
import { settingsApi } from '@/app/lib/api/settings'
import { DEFAULT_SETTINGS, type SystemSettings, type UserProfile, type SecuritySettings, type DisplaySettings } from '@/types/settings'
import SettingsSkeleton from '@/app/components/skeletons/SettingsSkeleton'

// MUI Imports
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

// Summary Cards
import UserProfileSummaryCard from '@/app/components/settings/cards/UserProfileSummaryCard'
import SystemSettingsSummaryCard from '@/app/components/settings/cards/SystemSettingsSummaryCard'
import SecuritySettingsSummaryCard from '@/app/components/settings/cards/SecuritySettingsSummaryCard'
import DisplaySettingsSummaryCard from '@/app/components/settings/cards/DisplaySettingsSummaryCard'
import AccountSettingsSummaryCard from '@/app/components/settings/cards/AccountSettingsSummaryCard'

// Modals
import UserProfileModal from '@/app/components/settings/modals/UserProfileModal'
import SystemSettingsModal from '@/app/components/settings/modals/SystemSettingsModal'
import SecuritySettingsModal from '@/app/components/settings/modals/SecuritySettingsModal'
import DisplaySettingsModal from '@/app/components/settings/modals/DisplaySettingsModal'

export default function SettingsPage() {
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SETTINGS.systemSettings)
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    birthdate: '',
    avatar: '',
    bio: ''
  })
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 60
  })
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    theme: 'light',
    language: 'ko',
    timezone: 'Asia/Seoul',
    dateFormat: 'YYYY년 MM월 DD일',
    currency: 'KRW',
    timeFormat: '24h'
  })
  const [loading, setLoading] = useState(true)

  // Modal states
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [systemModalOpen, setSystemModalOpen] = useState(false)
  const [securityModalOpen, setSecurityModalOpen] = useState(false)
  const [displayModalOpen, setDisplayModalOpen] = useState(false)

  const toast = useAppToast()

  // 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        const data = await settingsApi.get()
        setSystemSettings(data.systemSettings)

        // TODO: 실제 사용자 API에서 프로필 정보 로드
        // 임시로 mock 데이터 사용
        setUserProfile({
          name: '사용자',
          email: 'user@example.com',
          phone: '',
          birthdate: '',
          avatar: '',
          bio: ''
        })
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

  // 개인 프로필 저장
  const handleSaveUserProfile = async (data: UserProfile) => {
    try {
      // TODO: 실제 사용자 API로 프로필 저장
      setUserProfile(data)
      toast.success('개인 정보가 저장되었습니다.')
    } catch (error) {
      console.error('개인 정보 저장 실패:', error)
      toast.error('개인 정보 저장에 실패했습니다.', error instanceof Error ? error.message : '알 수 없는 오류')
    }
  }

  // 보안 설정 저장
  const handleSaveSecuritySettings = async (data: SecuritySettings) => {
    try {
      // TODO: 실제 보안 설정 API로 저장
      setSecuritySettings(data)
      toast.success('보안 설정이 저장되었습니다.')
    } catch (error) {
      console.error('보안 설정 저장 실패:', error)
      toast.error('보안 설정 저장에 실패했습니다.', error instanceof Error ? error.message : '알 수 없는 오류')
    }
  }

  // 표시 설정 저장
  const handleSaveDisplaySettings = async (data: DisplaySettings) => {
    try {
      // TODO: 실제 표시 설정 API로 저장
      setDisplaySettings(data)
      toast.success('표시 설정이 저장되었습니다.')
    } catch (error) {
      console.error('표시 설정 저장 실패:', error)
      toast.error('표시 설정 저장에 실패했습니다.', error instanceof Error ? error.message : '알 수 없는 오류')
    }
  }

  // 계정 관리 핸들러들
  const handleLogout = async () => {
    if (confirm('정말 로그아웃하시겠습니까?')) {
      try {
        // TODO: 실제 로그아웃 API 호출
        toast.success('로그아웃되었습니다.')
        // 리다이렉트 로직
        window.location.href = '/login'
      } catch (error) {
        toast.error('로그아웃에 실패했습니다.')
      }
    }
  }

  const handleDeleteAccount = async () => {
    const confirmText = '계정 삭제 확인'
    const userInput = prompt(`계정 삭제를 진행하려면 "${confirmText}"을 입력하세요.`)

    if (userInput === confirmText) {
      if (confirm('정말 계정을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.')) {
        try {
          // TODO: 실제 계정 삭제 API 호출
          toast.success('계정이 삭제되었습니다.')
          // 리다이렉트 로직
          window.location.href = '/'
        } catch (error) {
          toast.error('계정 삭제에 실패했습니다.')
        }
      }
    } else if (userInput !== null) {
      toast.error('확인 문구가 일치하지 않습니다.')
    }
  }

  const handleExportData = async () => {
    try {
      // TODO: 실제 데이터 익스포트 API 호출
      toast.success('데이터 내보내기가 시작되었습니다. 이메일로 다운로드 링크를 보내드리겠습니다.')
    } catch (error) {
      toast.error('데이터 내보내기에 실패했습니다.')
    }
  }

  // 시스템 설정 저장
  const handleSaveSystemSettings = async (data: SystemSettings) => {
    try {
      await settingsApi.update({ systemSettings: data })
      setSystemSettings(data)
      toast.success('시스템 설정이 저장되었습니다.')
    } catch (error) {
      console.error('시스템 설정 저장 실패:', error)
      toast.error('시스템 설정 저장에 실패했습니다.', error instanceof Error ? error.message : '알 수 없는 오류')
    }
  }

  if (loading) {
    return (
      <Container maxWidth={false} sx={{ py: 4, pb: 12, px: { xs: 1.5, sm: 2, md: 3 }, maxWidth: { xs: '100%', md: '1200px' }, width: '100%' }}>
        <SettingsSkeleton />
      </Container>
    )
  }

  return (
    <Container maxWidth={false} sx={{ py: 4, pb: 12, px: { xs: 1.5, sm: 2, md: 3 }, maxWidth: { xs: '100%', md: '1200px' }, width: '100%' }}>
      <Stack spacing={4}>
        {/* 헤더 */}
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            설정
          </Typography>
          <Typography variant="body2" color="text.secondary">
            계정 정보, 알림, 표시 등 개인 설정을 관리하세요
          </Typography>
        </Box>

        {/* 요약 카드들 */}
        <Stack spacing={3}>
          <UserProfileSummaryCard
            data={userProfile}
            onEdit={() => setProfileModalOpen(true)}
          />

          <SystemSettingsSummaryCard
            data={systemSettings}
            onEdit={() => setSystemModalOpen(true)}
          />

          <SecuritySettingsSummaryCard
            data={securitySettings}
            onEdit={() => setSecurityModalOpen(true)}
          />

          <DisplaySettingsSummaryCard
            data={displaySettings}
            onEdit={() => setDisplayModalOpen(true)}
          />

          <AccountSettingsSummaryCard
            onLogout={handleLogout}
            onDeleteAccount={handleDeleteAccount}
            onExportData={handleExportData}
          />
        </Stack>
      </Stack>

      {/* 모달들 */}
      <UserProfileModal
        open={profileModalOpen}
        data={userProfile}
        onClose={() => setProfileModalOpen(false)}
        onSave={handleSaveUserProfile}
      />

      <SystemSettingsModal
        open={systemModalOpen}
        data={systemSettings}
        onClose={() => setSystemModalOpen(false)}
        onSave={handleSaveSystemSettings}
      />

      <SecuritySettingsModal
        open={securityModalOpen}
        data={securitySettings}
        onClose={() => setSecurityModalOpen(false)}
        onSave={handleSaveSecuritySettings}
      />

      <DisplaySettingsModal
        open={displayModalOpen}
        data={displaySettings}
        onClose={() => setDisplayModalOpen(false)}
        onSave={handleSaveDisplaySettings}
      />
    </Container>
  )
}
