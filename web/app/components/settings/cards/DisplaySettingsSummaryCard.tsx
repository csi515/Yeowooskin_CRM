'use client'

import Card from '@/app/components/ui/Card'
import Button from '@/app/components/ui/Button'
import { Pencil, Monitor, Globe, Clock } from 'lucide-react'
import { type DisplaySettings } from '@/types/settings'

type Props = {
    data: DisplaySettings
    onEdit: () => void
}

export default function DisplaySettingsSummaryCard({ data, onEdit }: Props) {
    const getThemeLabel = (theme: string) => {
        switch (theme) {
            case 'light': return '밝은 테마'
            case 'dark': return '어두운 테마'
            case 'auto': return '자동'
            default: return theme
        }
    }

    const getLanguageLabel = (lang: string) => {
        switch (lang) {
            case 'ko': return '한국어'
            case 'en': return 'English'
            default: return lang
        }
    }

    return (
        <Card>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-neutral-900">표시 설정</h3>
                    <p className="text-sm text-neutral-600 mt-1">테마, 언어, 시간대를 설정하세요</p>
                </div>
                <Button variant="outline" size="sm" onClick={onEdit} leftIcon={<Pencil className="h-4 w-4" />}>
                    편집
                </Button>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Monitor className="h-5 w-5 text-neutral-600" />
                        <span className="text-sm text-neutral-700">테마</span>
                    </div>
                    <span className="text-sm font-medium text-neutral-900">
                        {getThemeLabel(data.theme)}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-neutral-600" />
                        <span className="text-sm text-neutral-700">언어</span>
                    </div>
                    <span className="text-sm font-medium text-neutral-900">
                        {getLanguageLabel(data.language)}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-neutral-600" />
                        <span className="text-sm text-neutral-700">시간대</span>
                    </div>
                    <span className="text-sm font-medium text-neutral-900">
                        {data.timezone}
                    </span>
                </div>

                <div className="text-sm text-neutral-700">
                    <span className="font-medium">날짜 형식:</span> {data.dateFormat}
                </div>

                <div className="text-sm text-neutral-700">
                    <span className="font-medium">시간 형식:</span> {data.timeFormat === '24h' ? '24시간제' : '12시간제'}
                </div>

                <div className="text-sm text-neutral-700">
                    <span className="font-medium">통화:</span> {data.currency}
                </div>
            </div>
        </Card>
    )
}
