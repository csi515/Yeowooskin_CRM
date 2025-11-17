// Service Worker - 네트워크 우선(Network-First) 캐싱 전략
const CACHE_NAME = 'yeouskin-crm-v1'
const RUNTIME_CACHE = 'yeouskin-crm-runtime-v1'

// 캐시할 리소스 목록
const PRECACHE_URLS = [
  '/',
  '/index.html',
]

// 설치 이벤트: 정적 리소스 캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_URLS)
      })
      .then(() => {
        return self.skipWaiting() // 즉시 활성화
      })
  )
})

// 활성화 이벤트: 오래된 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE
          })
          .map((cacheName) => {
            return caches.delete(cacheName)
          })
      )
    })
    .then(() => {
      return self.clients.claim() // 모든 클라이언트 제어
    })
  )
})

// fetch 이벤트: 네트워크 우선 전략
self.addEventListener('fetch', (event) => {
  // GET 요청만 처리
  if (event.request.method !== 'GET') {
    return
  }

  // 외부 리소스는 네트워크만 사용
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  event.respondWith(
    // 네트워크 우선 전략
    fetch(event.request)
      .then((response) => {
        // 네트워크 요청 성공 시 응답을 캐시에 저장
        if (response && response.status === 200) {
          const responseToCache = response.clone()
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      })
      .catch(() => {
        // 네트워크 요청 실패 시 캐시에서 찾기
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          // 캐시에도 없으면 기본 페이지 반환
          if (event.request.destination === 'document') {
            return caches.match('/')
          }
          return new Response('오프라인 상태입니다.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          })
        })
      })
  )
})
