'use client'

import Card from '@/app/components/ui/Card'
import Button from '@/app/components/ui/Button'
import { LogOut, Trash2, Download } from 'lucide-react'

type Props = {
    onLogout: () => void
    onDeleteAccount: () => void
    onExportData: () => void
}

export default function AccountSettingsSummaryCard({ onLogout, onDeleteAccount, onExportData }: Props) {
    return (
        <Card>
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">계정 관리</h3>
                <p className="text-sm text-neutral-600 mt-1">계정 관련 작업을 수행하세요</p>
            </div>

            <div className="space-y-3">
                <Button
                    variant="outline"
                    onClick={onExportData}
                    leftIcon={<Download className="h-4 w-4" />}
                    className="w-full justify-start"
                >
                    내 데이터 내보내기
                </Button>

                <Button
                    variant="outline"
                    onClick={onLogout}
                    leftIcon={<LogOut className="h-4 w-4" />}
                    className="w-full justify-start text-neutral-700 hover:text-neutral-900"
                >
                    로그아웃
                </Button>

                <div className="pt-3 border-t border-neutral-200">
                    <p className="text-sm text-neutral-600 mb-3">
                        계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 취소할 수 없습니다.
                    </p>
                    <Button
                        variant="danger"
                        onClick={onDeleteAccount}
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        className="w-full justify-start"
                    >
                        계정 삭제
                    </Button>
                </div>
            </div>
        </Card>
    )
}
