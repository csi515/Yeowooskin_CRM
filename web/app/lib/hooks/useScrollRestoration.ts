import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// 페이지별 스크롤 위치 저장 및 복원
const scrollPositions: Record<string, number> = {}

export function useScrollRestoration() {
  const pathname = usePathname()

  useEffect(() => {
    // 현재 스크롤 위치 저장
    const saveScrollPosition = () => {
      if (pathname) {
        scrollPositions[pathname] = window.scrollY
      }
    }

    // 스크롤 위치 복원
    const restoreScrollPosition = () => {
      if (pathname && scrollPositions[pathname] !== undefined) {
        window.scrollTo(0, scrollPositions[pathname])
      }
    }

    // 페이지 언마운트 시 저장
    window.addEventListener('beforeunload', saveScrollPosition)
    
    // 스크롤 이벤트 디바운싱
    let timeout: NodeJS.Timeout
    const handleScroll = () => {
      clearTimeout(timeout)
      timeout = setTimeout(saveScrollPosition, 150)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    // 페이지 로드 시 복원
    restoreScrollPosition()

    return () => {
      window.removeEventListener('beforeunload', saveScrollPosition)
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(timeout)
    }
  }, [pathname])
}
