'use client'

import { ReactNode, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'

interface Props {
    title: string
    description?: string
    icon: ReactNode
    children: ReactNode
    defaultExpanded?: boolean
    iconColor?: string
    className?: string
}

export default function CollapsibleSection({
    title,
    description,
    icon,
    children,
    defaultExpanded = true,
    iconColor = 'from-pink-500 to-pink-600',
    className = '',
}: Props) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded)

    return (
        <div className={clsx('bg-white rounded-xl border border-neutral-200 shadow-md overflow-hidden transition-all duration-200', className)}>
            {/* 헤더 */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className={clsx(
                    'w-full px-6 py-5 flex items-center gap-4 transition-all duration-200',
                    'hover:bg-neutral-50 active:bg-neutral-100',
                    'focus-visible:ring-2 focus-visible:ring-[#F472B6] focus-visible:ring-offset-2',
                    isExpanded && 'bg-gradient-to-r from-neutral-50/50 to-neutral-100/50'
                )}
                aria-expanded={isExpanded}
                aria-label={`${title} 섹션 ${isExpanded ? '접기' : '펼치기'}`}
            >
                {/* 아이콘 */}
                <div className={clsx(
                    'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
                    'bg-gradient-to-br shadow-md',
                    iconColor
                )}>
                    <div className="text-white w-6 h-6">
                        {icon}
                    </div>
                </div>

                {/* 제목 및 설명 */}
                <div className="flex-1 text-left">
                    <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
                    {description && (
                        <p className="text-sm text-neutral-600 mt-1">{description}</p>
                    )}
                </div>

                {/* 접기/펼치기 아이콘 */}
                <ChevronDown
                    className={clsx(
                        'w-6 h-6 text-neutral-500 transition-transform duration-200',
                        isExpanded && 'rotate-180'
                    )}
                />
            </button>

            {/* 콘텐츠 */}
            <div
                className={clsx(
                    'transition-all duration-300 ease-in-out overflow-hidden',
                    isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
                )}
            >
                <div className="px-6 pb-6 pt-2">
                    {children}
                </div>
            </div>
        </div>
    )
}
