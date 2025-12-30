'use client'

import Card from '@/app/components/ui/Card'
import Button from '@/app/components/ui/Button'
import { Pencil, User } from 'lucide-react'
import { type UserProfile } from '@/types/settings'

type Props = {
    data: UserProfile
    onEdit: () => void
}

export default function UserProfileSummaryCard({ data, onEdit }: Props) {
    return (
        <Card>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-neutral-900">개인 정보</h3>
                    <p className="text-sm text-neutral-600 mt-1">이름, 연락처, 프로필 정보를 관리하세요</p>
                </div>
                <Button variant="outline" size="sm" onClick={onEdit} leftIcon={<Pencil className="h-4 w-4" />}>
                    편집
                </Button>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-neutral-600" />
                    </div>
                    <div>
                        <div className="font-medium text-neutral-900">{data.name || '이름 미설정'}</div>
                        <div className="text-sm text-neutral-600">{data.email}</div>
                    </div>
                </div>

                {data.phone && (
                    <div className="text-sm text-neutral-700">
                        <span className="font-medium">전화번호:</span> {data.phone}
                    </div>
                )}

                {data.birthdate && (
                    <div className="text-sm text-neutral-700">
                        <span className="font-medium">생년월일:</span> {new Date(data.birthdate).toLocaleDateString('ko-KR')}
                    </div>
                )}
            </div>
        </Card>
    )
}
