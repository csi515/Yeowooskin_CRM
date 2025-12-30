'use client'

import { useState, useEffect } from 'react'
import { Modal, ModalBody, ModalFooter } from '@/app/components/ui/Modal'
import Button from '@/app/components/ui/Button'
import { type DisplaySettings } from '@/types/settings'

type Props = {
    open: boolean
    data: DisplaySettings
    onClose: () => void
    onSave: (data: DisplaySettings) => void
}

export default function DisplaySettingsModal({ open, data, onClose, onSave }: Props) {
    const [formData, setFormData] = useState<DisplaySettings>(data)
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        if (open) {
            setFormData(data)
            setHasChanges(false)
        }
    }, [open, data])

    const handleChange = (field: keyof DisplaySettings, value: any) => {
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
                <h2 className="text-2xl font-bold text-neutral-900">표시 설정</h2>
                <p className="text-sm text-neutral-600 mt-1">앱의 표시 방식을 설정합니다.</p>
            </div>

            <ModalBody>
                <div className="space-y-6">
                    {/* 테마 설정 */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            테마
                        </label>
                        <select
                            value={formData.theme}
                            onChange={(e) => handleChange('theme', e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        >
                            <option value="light">밝은 테마</option>
                            <option value="dark">어두운 테마</option>
                            <option value="auto">시스템 설정에 따라</option>
                        </select>
                    </div>

                    {/* 언어 설정 */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            언어
                        </label>
                        <select
                            value={formData.language}
                            onChange={(e) => handleChange('language', e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        >
                            <option value="ko">한국어</option>
                            <option value="en">English</option>
                        </select>
                    </div>

                    {/* 시간대 설정 */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            시간대
                        </label>
                        <select
                            value={formData.timezone}
                            onChange={(e) => handleChange('timezone', e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        >
                            <option value="Asia/Seoul">대한민국 (KST)</option>
                            <option value="America/New_York">미국 동부 (EST)</option>
                            <option value="Europe/London">영국 (GMT)</option>
                            <option value="Asia/Tokyo">일본 (JST)</option>
                        </select>
                    </div>

                    {/* 날짜 형식 */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            날짜 표시 형식
                        </label>
                        <select
                            value={formData.dateFormat}
                            onChange={(e) => handleChange('dateFormat', e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        >
                            <option value="YYYY-MM-DD">2024-01-15</option>
                            <option value="MM/DD/YYYY">01/15/2024</option>
                            <option value="DD/MM/YYYY">15/01/2024</option>
                            <option value="YYYY년 MM월 DD일">2024년 01월 15일</option>
                        </select>
                    </div>

                    {/* 시간 형식 */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            시간 표시 형식
                        </label>
                        <select
                            value={formData.timeFormat}
                            onChange={(e) => handleChange('timeFormat', e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        >
                            <option value="24h">24시간제 (14:30)</option>
                            <option value="12h">12시간제 (2:30 PM)</option>
                        </select>
                    </div>

                    {/* 통화 설정 */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            통화
                        </label>
                        <select
                            value={formData.currency}
                            onChange={(e) => handleChange('currency', e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        >
                            <option value="KRW">한국 원 (₩)</option>
                            <option value="USD">미국 달러 ($)</option>
                            <option value="EUR">유로 (€)</option>
                            <option value="JPY">일본 엔 (¥)</option>
                        </select>
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
