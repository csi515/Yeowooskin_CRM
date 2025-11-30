'use client'

import { useState, useEffect } from 'react'
import { Modal, ModalBody, ModalFooter } from '@/app/components/ui/Modal'
import Button from '@/app/components/ui/Button'
import { type StaffSettings } from '@/types/settings'
import StaffSettingsSection from '@/app/components/settings/StaffSettingsSection'

type Props = {
    open: boolean
    data: StaffSettings
    onClose: () => void
    onSave: (data: StaffSettings) => void
}

export default function StaffSettingsModal({ open, data, onClose, onSave }: Props) {
    const [formData, setFormData] = useState<StaffSettings>(data)
    const [hasChanges, setHasChanges] = useState(false)

    // open이 true가 될 때마다 데이터 초기화
    useEffect(() => {
        if (open) {
            setFormData(data)
            setHasChanges(false)
        }
    }, [open, data])

    const handleChange = (changes: Partial<StaffSettings>) => {
        setFormData((prev) => ({ ...prev, ...changes }))
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
        setFormData(data) // 원래 데이터로 복원
        setHasChanges(false)
        onClose()
    }

    return (
        <Modal open={open} onClose={handleCancel} size="xl">
            {/* 헤더 */}
            <div className="px-6 py-4 border-b border-neutral-200 bg-white sticky top-0 z-10">
                <h2 className="text-2xl font-bold text-neutral-900">직원 직책 설정</h2>
                <p className="text-sm text-neutral-600 mt-1">직원 직책을 관리합니다.</p>
            </div>

            {/* 바디 */}
            <ModalBody>
                <StaffSettingsSection data={formData} onChange={handleChange} />
            </ModalBody>

            {/* 푸터 */}
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
