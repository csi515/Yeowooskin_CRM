'use client'

import { ReactNode, useState } from 'react'
import { Info } from 'lucide-react'
import clsx from 'clsx'

interface Props {
    content: string | ReactNode
    className?: string
}

export default function InfoTooltip({ content, className = '' }: Props) {
    const [isVisible, setIsVisible] = useState(false)

    return (
        <div className={clsx('relative inline-block', className)}>
            <button
                type="button"
                className="text-neutral-400 hover:text-neutral-600 transition-colors focus-visible:ring-2 focus-visible:ring-[#F472B6] focus-visible:ring-offset-1 rounded-full p-0.5"
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                onFocus={() => setIsVisible(true)}
                onBlur={() => setIsVisible(false)}
                aria-label="도움말"
            >
                <Info className="w-4 h-4" />
            </button>

            {/* 툴팁 */}
            {isVisible && (
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-900 text-white text-xs rounded-lg shadow-lg max-w-xs whitespace-normal">
                    {content}
                    {/* 화살표 */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                        <div className="border-4 border-transparent border-t-neutral-900" />
                    </div>
                </div>
            )}
        </div>
    )
}
