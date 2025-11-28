'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/app/lib/context/ThemeContext'
import Button from './Button'
import Dropdown from './Dropdown'

type Props = {
  variant?: 'button' | 'dropdown'
  className?: string
}

export default function ThemeToggle({ variant = 'button', className }: Props) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme()

  if (variant === 'dropdown') {
    return (
      <Dropdown
        trigger={
          resolvedTheme === 'dark' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )
        }
        items={[
          {
            label: '라이트 모드',
            icon: <Sun className="h-4 w-4" />,
            onClick: () => setTheme('light'),
          },
          {
            label: '다크 모드',
            icon: <Moon className="h-4 w-4" />,
            onClick: () => setTheme('dark'),
          },
          {
            label: '시스템 설정',
            icon: <Monitor className="h-4 w-4" />,
            onClick: () => setTheme('system'),
          },
        ]}
      />
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className={className}
      leftIcon={
        resolvedTheme === 'dark' ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )
      }
      aria-label={`${resolvedTheme === 'dark' ? '라이트' : '다크'} 모드로 전환`}
    >
      {theme === 'system' && <Monitor className="h-4 w-4 ml-1 opacity-50" />}
    </Button>
  )
}
