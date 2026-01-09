/**
 * Service Worker - 네트워크 우선(Network-First) 캐싱 전략
 * 
 * 네트워크 연결이 가능할 때 최신 리소스를 사용하고,
 * 오프라인일 때만 캐시된 리소스를 사용합니다.
 */

const CACHE_NAME = 'beautyhub-v1'
const RUNTIME_CACHE = 'beautyhub-runtime-v1'

// 캐시할 정적 리소스 목록
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/customers',
  '/products',
  '/appointments',
  '/finance',
  '/staff',
]

// 설치 이벤트: 정적 리소스 캐싱
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...')

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets')
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })))
    })
  )

  // 즉시 활성화하여 이전 버전을 대체
  self.skipWaiting()
})

// 활성화 이벤트: 오래된 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...')

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // 현재 버전이 아닌 캐시 삭제
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    })
  )

  // 모든 클라이언트에 즉시 제어권 부여
  return self.clients.claim()
})

// fetch 이벤트: 네트워크 우선 전략
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 같은 출처의 요청만 처리
  if (url.origin !== location.origin) {
    return
  }

  // GET 요청만 캐싱
  if (request.method !== 'GET') {
    return
  }

  // 네트워크 우선 전략: 네트워크에서 먼저 시도, 실패 시 캐시 사용
  event.respondWith(
    fetch(request)
      .then((response) => {
        // 네트워크 요청 성공 시 응답을 캐시에 저장
        if (response && response.status === 200) {
          const responseToCache = response.clone()

          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache)
          })
        }

        return response
      })
      .catch(() => {
        // 네트워크 요청 실패 시 캐시에서 찾기
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }

          // 캐시에도 없으면 오프라인 페이지 반환 (선택사항)
          if (request.destination === 'document') {
            return caches.match('/')
          }

          return new Response('오프라인 상태입니다.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain; charset=utf-8',
            }),
          })
        })
      })
  )
})

// 메시지 이벤트: 클라이언트와 통신
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls)
      })
    )
  }
})

