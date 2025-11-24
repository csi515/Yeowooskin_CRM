'use client'

import Card from '../ui/Card'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { type SystemSettings } from '@/types/settings'
import { useAppToast } from '@/app/lib/ui/toast'

type Props = {
  data: SystemSettings
  onChange: (data: Partial<SystemSettings>) => void
}

export default function SystemSettingsSection({ data, onChange }: Props) {
  const toast = useAppToast()

  const handleBackup = async () => {
    try {
      toast.info('백업 기능은 준비 중입니다.')
      // TODO: 백업 기능 구현
    } catch (error) {
      toast.error('백업 실패', error instanceof Error ? error.message : '알 수 없는 오류')
    }
  }

  const handleRestore = async () => {
    try {
      toast.info('복원 기능은 준비 중입니다.')
      // TODO: 복원 기능 구현
    } catch (error) {
      toast.error('복원 실패', error instanceof Error ? error.message : '알 수 없는 오류')
    }
  }

  return (
    <>
      <Card>
        <h2 className="text-xl font-bold text-neutral-900 mb-6">시스템 및 앱 관리 설정</h2>
        
        <div className="space-y-6">
          {/* 알림 설정 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-800">알림 설정</h3>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.pushNotificationsEnabled}
                onChange={(e) => onChange({ pushNotificationsEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-300 text-blue-600"
              />
              <span className="text-sm font-medium text-neutral-700">PUSH 알림 전체</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.customerNotificationsEnabled}
                onChange={(e) => onChange({ customerNotificationsEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-300 text-blue-600"
              />
              <span className="text-sm font-medium text-neutral-700">고객 알림</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.internalNotificationsEnabled}
                onChange={(e) => onChange({ internalNotificationsEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-300 text-blue-600"
              />
              <span className="text-sm font-medium text-neutral-700">내부 알림</span>
            </label>
          </div>

          {/* 데이터 관리 */}
          <div className="border-t border-neutral-200 pt-4 space-y-4">
            <h3 className="text-lg font-semibold text-neutral-800">데이터 관리</h3>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleBackup}>
                백업
              </Button>
              <Button variant="outline" onClick={handleRestore}>
                복원
              </Button>
            </div>
          </div>

          {/* 보안 설정 */}
          <div className="border-t border-neutral-200 pt-4 space-y-4">
            <h3 className="text-lg font-semibold text-neutral-800">보안 설정</h3>
            
            <Select
              label="자동 로그아웃 시간"
              value={String(data.autoLogoutMinutes)}
              onChange={(e) => onChange({ autoLogoutMinutes: Number(e.target.value) })}
            >
              <option value="15">15분</option>
              <option value="30">30분</option>
              <option value="60">60분</option>
              <option value="120">2시간</option>
              <option value="0">사용 안 함</option>
            </Select>
          </div>
        </div>
      </Card>
    </>
  )
}

