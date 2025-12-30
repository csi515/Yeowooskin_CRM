'use client'

import { useState, useEffect } from 'react'
import { Modal, ModalBody, ModalFooter } from '@/app/components/ui/Modal'
import Button from '@/app/components/ui/Button'
import ToggleSwitch from '@/app/components/ui/ToggleSwitch'
import { type SecuritySettings } from '@/types/settings'

type Props = {
    open: boolean
    data: SecuritySettings
    onClose: () => void
    onSave: (data: SecuritySettings) => void
    onChangePassword?: () => void
}

export default function SecuritySettingsModal({ open, data, onClose, onSave, onChangePassword }: Props) {
    const [formData, setFormData] = useState<SecuritySettings>(data)
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        if (open) {
            setFormData(data)
            setHasChanges(false)
        }
    }, [open, data])

    const handleChange = (field: keyof SecuritySettings, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        setHasChanges(true)
    }

    const handleSave = () => {
        onSave(formData)
        setHasChanges(false)
        onClose()
    }

    const handleCancel = () => {
        if (hasChanges) {
            const confirm = window.confirm('저장하지 않은 변경사항이 있습니다. 정말 닫으시겠습니까?')
            if (!confirm) return
        }
        setFormData(data)
        setHasChanges(false)
        onClose()
    }

    return (
        <Modal open={open} onClose={handleCancel} size="lg">
            <div className="px-6 py-4 border-b border-neutral-200 bg-white sticky top-0 z-10">
                <h2 className="text-2xl font-bold text-neutral-900">보안 설정</h2>
                <p className="text-sm text-neutral-600 mt-1">계정 보안을 설정합니다.</p>
            </div>

            <ModalBody>
                <div className="space-y-6">
                    {/* 2단계 인증 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-neutral-800">2단계 인증</h3>
                        </div>
                        <ToggleSwitch
                            checked={formData.twoFactorEnabled}
                            onChange={(checked) => handleChange('twoFactorEnabled', checked)}
                            label="2단계 인증 활성화"
                        />
                        <p className="text-sm text-neutral-600">
                            2단계 인증을 활성화하면 로그인 시 추가 보안 단계를 거치게 됩니다.
                        </p>
                    </div>

                    {/* 세션 타임아웃 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-neutral-800">세션 설정</h3>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                자동 로그아웃 시간 (분)
                            </label>
                            <select
                                value={formData.sessionTimeout}
                                onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                            >
                                <option value={15}>15분</option>
                                <option value={30}>30분</option>
                                <option value={60}>1시간</option>
                                <option value={240}>4시간</option>
                                <option value={480}>8시간</option>
                            </select>
                        </div>
                    </div>

                    {/* 비밀번호 변경 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-neutral-800">비밀번호</h3>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-700">비밀번호를 변경하려면 클릭하세요.</p>
                                {formData.passwordLastChanged && (
                                    <p className="text-xs text-neutral-500 mt-1">
                                        마지막 변경: {new Date(formData.passwordLastChanged).toLocaleDateString('ko-KR')}
                                    </p>
                                )}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onChangePassword}
                            >
                                비밀번호 변경
                            </Button>
                        </div>
                    </div>
                </div>
            </ModalBody>

            <ModalFooter>
                <div className="flex items-center justify-between w-full">
                    <div>
                        {hasChanges && (
                            <span className="text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                                변경사항이 있습니다
                            </span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={handleCancel}>
                            취소
                        </Button>
                        <Button variant="primary" onClick={handleSave} disabled={!hasChanges}>
                            저장
                        </Button>
                    </div>
                </div>
            </ModalFooter>
        </Modal>
    )
}
