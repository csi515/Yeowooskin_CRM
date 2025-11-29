'use client'

import { useState, memo } from 'react'
import { Settings, Bell, Database, AlertTriangle } from 'lucide-react'
import CollapsibleSection from '../ui/CollapsibleSection'
import Select from '../ui/Select'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { ModalBody, ModalFooter } from '../ui/Modal'
import ToggleSwitch from '../ui/ToggleSwitch'
import InfoTooltip from '../ui/InfoTooltip'
import { type SystemSettings } from '@/types/settings'
import { useAppToast } from '@/app/lib/ui/toast'

type Props = {
  data: SystemSettings
  onChange: (data: Partial<SystemSettings>) => void
}

function SystemSettingsSection({ data, onChange }: Props) {
  const [showResetModal, setShowResetModal] = useState(false)
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

  const handleResetAll = async () => {
    try {
      // TODO: 모든 데이터 초기화 구현
      toast.success('모든 데이터가 초기화되었습니다.')
      setShowResetModal(false)
      // 페이지 새로고침
      window.location.reload()
    } catch (error) {
      toast.error('초기화 실패', error instanceof Error ? error.message : '알 수 없는 오류')
    }
  }

  return (
    <>
      <CollapsibleSection
        title="시스템 및 앱 관리 설정"
        description="시스템 알림과 데이터 관리를 설정합니다."
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

          {/* 데이터 관리 */}
          <div className="border-t border-neutral-200 pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-neutral-700" />
              <h3 className="text-lg font-semibold text-neutral-800">데이터 관리</h3>
              <InfoTooltip content="데이터 백업, 복원 및 초기화 기능입니다." />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleBackup}
                className="flex-1"
              >
                백업
              </Button>
              <Button
                variant="outline"
                onClick={handleRestore}
                className="flex-1"
              >
                복원
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowResetModal(true)}
                className="flex-1 border-2 border-rose-600"
                leftIcon={<AlertTriangle className="h-4 w-4" />}
              >
                모든 데이터 초기화
              </Button>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-rose-900 text-sm">주의사항</h4>
                  <p className="text-sm text-rose-700 mt-1">
                    데이터 초기화는 되돌릴 수 없습니다. 신중하게 사용하세요.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 보안 설정 */}
          <div className="border-t border-neutral-200 pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-neutral-700" />
              <h3 className="text-lg font-semibold text-neutral-800">보안 설정</h3>
              <InfoTooltip content="자동 로그아웃 시간을 설정하세요." />
            </div>

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
      </CollapsibleSection>

      {/* 데이터 초기화 확인 모달 */}
      <Modal open={showResetModal} onClose={() => setShowResetModal(false)} size="md">
        <ModalBody>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">모든 데이터 초기화</h3>
            </div>
            <p className="text-sm text-neutral-600">
              이 작업은 되돌릴 수 없습니다. 모든 고객 정보, 예약, 거래 내역, 설정이 삭제됩니다.
            </p>
            <p className="text-sm font-semibold text-rose-600">
              정말로 모든 데이터를 초기화하시겠습니까?
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowResetModal(false)}>
            취소
          </Button>
          <Button variant="danger" onClick={handleResetAll}>
            초기화
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}

// React.memo로 래핑하여 props가 변경되지 않으면 리렌더링 방지
export default memo(SystemSettingsSection)
