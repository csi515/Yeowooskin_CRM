'use client'

import Card from '@/app/components/ui/Card'
import Button from '@/app/components/ui/Button'
import { Pencil } from 'lucide-react'
import { type StaffSettings } from '@/types/settings'

type Props = {
    data: StaffSettings
    onEdit: () => void
}

export default function StaffSettingsSummaryCard({ data, onEdit }: Props) {
    return (
        <Card>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-neutral-900">직원 직책 설정</h3>
                    <p className="text-sm text-neutral-600 mt-1">직원 직책 관리</p>
                </div>
                <Button variant="outline" size="sm" onClick={onEdit} leftIcon={<Pencil className="h-4 w-4" />}>
                    편집
                </Button>
            </div>

            <div className="space-y-3">
                {/* 직책 목록 */}
                <div>
                    <div className="text-xs font-semibold text-neutral-500 uppercase mb-2">등록된 직책</div>
                    {data?.positions && data.positions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {data.positions.map((position) => (
                                <span
                                    key={position}
                                    className="inline-flex items-center px-2.5 py-1 rounded-md bg-purple-50 border border-purple-200 text-purple-700 text-sm"
                                >
                                    {position}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-neutral-400 italic">등록된 직책이 없습니다</p>
                    )}
                </div>

                {/* 기본 근무시간 */}
                <div>
                    <div className="text-xs font-semibold text-neutral-500 uppercase mb-2">기본 근무시간</div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium">
                            {data?.defaultWorkHours?.startTime || '09:00'}
                        </span>
                        <span className="text-neutral-400">~</span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium">
                            {data?.defaultWorkHours?.endTime || '18:00'}
                        </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">스케줄 추가 시 기본값</p>
                </div>
            </div>
        </Card>
    )
}
