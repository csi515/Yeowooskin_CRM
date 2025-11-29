'use client'

import clsx from 'clsx'

interface Props {
    checked: boolean
    onChange: (checked: boolean) => void
    label?: string
    disabled?: boolean
    className?: string
}

export default function ToggleSwitch({
    checked,
    onChange,
    label,
    disabled = false,
    className = '',
}: Props) {
    return (
        <label
            className={clsx(
                'inline-flex items-center gap-3 cursor-pointer',
                disabled && 'opacity-50 cursor-not-allowed',
                className
            )}
        >
            {/* 스위치 */}
            <div className="relative">
                <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={checked}
                    onChange={(e) => !disabled && onChange(e.target.checked)}
                    disabled={disabled}
                    role="switch"
                    aria-checked={checked}
                    aria-label={label}
                />
                <div
                    className={clsx(
                        'w-11 h-6 rounded-full transition-colors duration-200',
                        'peer-focus-visible:ring-2 peer-focus-visible:ring-[#F472B6] peer-focus-visible:ring-offset-2',
                        checked
                            ? 'bg-[#F472B6]'
                            : 'bg-neutral-300'
                    )}
                />
                <div
                    className={clsx(
                        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200',
                        checked && 'translate-x-5'
                    )}
                />
            </div>

            {/* 레이블 */}
            {label && (
                <span className="text-sm font-medium text-neutral-700 select-none">
                    {label}
                </span>
            )}
        </label>
    )
}
