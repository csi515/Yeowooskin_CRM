'use client'

import { useEffect, useState } from 'react'

interface WindowWithOrientation {
  orientation?: number
}

type Orientation = 'portrait' | 'landscape'

/**
 * 화면 회전 감지 훅
 * 모바일에서 화면 방향 변경 감지
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<Orientation>('portrait')
  const [angle, setAngle] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth
      setOrientation(isPortrait ? 'portrait' : 'landscape')

      // 화면 각도 (0, 90, 180, 270)
      if (window.screen?.orientation) {
        setAngle(window.screen.orientation.angle)
      } else if ((window as unknown as WindowWithOrientation).orientation !== undefined) {
        setAngle((window as unknown as WindowWithOrientation).orientation!)
      }
    }

    updateOrientation()

    // Orientation API 지원 시
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', updateOrientation)
    } else {
      window.addEventListener('resize', updateOrientation)
      window.addEventListener('orientationchange', updateOrientation)
    }

    return () => {
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', updateOrientation)
      } else {
        window.removeEventListener('resize', updateOrientation)
        window.removeEventListener('orientationchange', updateOrientation)
      }
    }
  }, [])

  return {
    orientation,
    angle,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
  }
}

