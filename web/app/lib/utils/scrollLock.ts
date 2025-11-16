'use client'

let scrollLockCount = 0
let originalOverflow = ''

export function lockScroll() {
  scrollLockCount++
  
  if (scrollLockCount === 1) {
    // 첫 번째 lock 시 원본 스타일 저장
    originalOverflow = document.body.style.overflow || ''
    document.body.style.overflow = 'hidden'
  }
}

export function unlockScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1)
  
  if (scrollLockCount === 0) {
    // 모든 lock 해제 시 원본 스타일 복원
    document.body.style.overflow = originalOverflow
  }
}

export function resetScrollLock() {
  scrollLockCount = 0
  document.body.style.overflow = originalOverflow || ''
}
