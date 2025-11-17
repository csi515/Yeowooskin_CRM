'use client'

import { useEffect } from 'react'

export default function PWARegister() {
  useEffect(() => {
    // 브라우저가 Service Worker를 지원하는지 확인
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Service Worker 등록
      navigator.serviceWorker
        .register('/service-worker.js', {
          scope: '/',
        })
        .then((registration) => {
          console.log('Service Worker 등록 성공:', registration.scope)
          
          // 업데이트 확인
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // 새 버전이 설치되었을 때 사용자에게 알림 (선택사항)
                  console.log('새 버전이 사용 가능합니다.')
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('Service Worker 등록 실패:', error)
        })
    }
  }, [])

  return null
}
