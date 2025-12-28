'use client'

import { useState, memo } from 'react'
import { Users, Plus, Trash2 } from 'lucide-react'
import CollapsibleSection from '../ui/CollapsibleSection'
import Input from '../ui/Input'
import Button from '../ui/Button'
import InfoTooltip from '../ui/InfoTooltip'
import { type StaffSettings } from '@/types/settings'

type Props = {
    data: StaffSettings
    onChange: (data: Partial<StaffSettings>) => void
}

function StaffSettingsSection({ data, onChange }: Props) {
    const [newPosition, setNewPosition] = useState('')

    const addPosition = () => {
        if (newPosition.trim() && !data?.positions?.includes(newPosition.trim())) {
            onChange({
                positions: [...(data?.positions || []), newPosition.trim()],
            })
            setNewPosition('')
        }
    }

    const removePosition = (position: string) => {
        onChange({
            positions: data?.positions?.filter((p) => p !== position) || [],
        })
    }

    return (
        <CollapsibleSection
            title="직원 직책 설정"
            description="직원 직책을 관리합니다."
            icon={<Users className="w-6 h-6" />}
            iconColor="from-purple-500 to-purple-600"
        >
            <div className="space-y-6">
                {/* 직책 관리 */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-neutral-700" />
                        <h3 className="text-lg font-semibold text-neutral-800">직책 관리</h3>
                        <InfoTooltip content="직원에게 할당할 수 있는 직책을 등록하여 관리합니다." />
                    </div>

                    <div className="flex gap-2">
                        <Input
                            value={newPosition}
                            onChange={(e) => setNewPosition(e.target.value)}
                            placeholder="새 직책 입력"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    addPosition()
                                }
                            }}
                        />
                        <Button
                            variant="outline"
                            onClick={addPosition}
                            leftIcon={<Plus className="h-4 w-4" />}
                        >
                            추가
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {data?.positions?.map((position) => (
                            <div
                                key={position}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-700"
                            >
                                <span className="text-sm font-medium">{position}</span>
                                <button
                                    type="button"
                                    onClick={() => removePosition(position)}
                                    className="p-0.5 rounded hover:bg-purple-100 text-purple-600 hover:text-rose-600 transition-colors"
                                    aria-label={`${position} 삭제`}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 기본 근무시간 */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-neutral-700" />
                        <h3 className="text-lg font-semibold text-neutral-800">기본 근무시간</h3>
                        <InfoTooltip content="스케줄 추가 시 기본값으로 사용될 근무시간을 설정합니다." />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                시작 시간
                            </label>
                            <input
                                type="time"
                                value={data?.defaultWorkHours?.startTime || '09:00'}
                                onChange={(e) => onChange({
                                    defaultWorkHours: {
                                        ...data?.defaultWorkHours,
                                        startTime: e.target.value,
                                        endTime: data?.defaultWorkHours?.endTime || '18:00'
                                    }
                                })}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                종료 시간
                            </label>
                            <input
                                type="time"
                                value={data?.defaultWorkHours?.endTime || '18:00'}
                                onChange={(e) => onChange({
                                    defaultWorkHours: {
                                        ...data?.defaultWorkHours,
                                        startTime: data?.defaultWorkHours?.startTime || '09:00',
                                        endTime: e.target.value
                                    }
                                })}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <p className="text-xs text-neutral-500">
                        스케줄 추가 시 이 시간이 기본값으로 자동 입력됩니다.
                    </p>
                </div>
            </div>
        </CollapsibleSection>
    )
}

// React.memo로 래핑하여 props가 변경되지 않으면 리렌더링 방지
export default memo(StaffSettingsSection)
