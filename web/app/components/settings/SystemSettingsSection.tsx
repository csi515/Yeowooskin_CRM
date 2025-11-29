'use client'

import { memo } from 'react'
import { Settings, Bell } from 'lucide-react'
import CollapsibleSection from '../ui/CollapsibleSection'
import ToggleSwitch from '../ui/ToggleSwitch'
import InfoTooltip from '../ui/InfoTooltip'
import { type SystemSettings } from '@/types/settings'

type Props = {
  data: SystemSettings
  onChange: (data: Partial<SystemSettings>) => void
}

function SystemSettingsSection({ data, onChange }: Props) {
  return (
    <CollapsibleSection
      title="시스템 및 앱 관리 설정"
      description="시스템 알림을 설정합니다."
      icon={<Settings className="w-6 h-6" />}
      iconColor="from-purple-500 to-purple-600"
    >
      <div className="space-y-6">
        {/* 알림 설정 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-neutral-700" />
            <h3 className="text-lg font-semibold text-neutral-800">알림 설정</h3>
            <InfoTooltip content="앱의 알림 수신 여부를 설정하세요." />
          </div>

          <div className="space-y-3">
            <ToggleSwitch
              checked={data.pushNotificationsEnabled}
              onChange={(checked) => onChange({ pushNotificationsEnabled: checked })}
              label="PUSH 알림 전체"
            />

            <ToggleSwitch
              checked={data.customerNotificationsEnabled}
              onChange={(checked) => onChange({ customerNotificationsEnabled: checked })}
              label="고객 알림"
            />

            <ToggleSwitch
              checked={data.internalNotificationsEnabled}
              onChange={(checked) => onChange({ internalNotificationsEnabled: checked })}
              label="내부 알림"
            />
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}

// React.memo로 래핑하여 props가 변경되지 않으면 리렌더링 방지
export default memo(SystemSettingsSection)
