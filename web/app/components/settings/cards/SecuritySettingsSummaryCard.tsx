'use client'

import Card from '@/app/components/ui/Card'
import Button from '@/app/components/ui/Button'
import { Pencil, Shield, ShieldCheck } from 'lucide-react'
import { type SecuritySettings } from '@/types/settings'

type Props = {
    data: SecuritySettings
    onEdit: () => void
}

export default function SecuritySettingsSummaryCard({ data, onEdit }: Props) {
    return (
        <Card>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-neutral-900">보안 설정</h3>
                    <p className="text-sm text-neutral-600 mt-1">비밀번호, 2단계 인증을 관리하세요</p>
                </div>
                <Button variant="outline" size="sm" onClick={onEdit} leftIcon={<Pencil className="h-4 w-4" />}>
                    편집
                </Button>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {data.twoFactorEnabled ? (
                            <ShieldCheck className="h-5 w-5 text-green-600" />
                        ) : (
                            <Shield className="h-5 w-5 text-neutral-400" />
                        )}
                        <span className="text-sm text-neutral-700">2단계 인증</span>
                    </div>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                        data.twoFactorEnabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-neutral-100 text-neutral-600'
                    }`}>
                        {data.twoFactorEnabled ? '활성화' : '비활성화'}
                    </span>
                </div>

                <div className="text-sm text-neutral-700">
                    <span className="font-medium">세션 타임아웃:</span> {data.sessionTimeout}분
                </div>

                {data.passwordLastChanged && (
                    <div className="text-sm text-neutral-700">
                        <span className="font-medium">비밀번호 변경일:</span>{' '}
                        {new Date(data.passwordLastChanged).toLocaleDateString('ko-KR')}
                    </div>
                )}
            </div>
        </Card>
    )
}
