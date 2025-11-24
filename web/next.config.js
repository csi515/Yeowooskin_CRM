/**** Next.js config ****/
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { 
    domains: [],
    // Vercel 최적화를 위한 이미지 설정
    formats: ['image/avif', 'image/webp'],
    // 모바일 성능 최적화
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    // 모바일에서 이미지 품질 최적화
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // PWA 설정
  async headers() {
    return [
      {
        source: '/service-worker.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ]
  },
  experimental: { 
    serverActions: { 
      bodySizeLimit: '2mb' 
    },
    // 번들 크기 최적화
    optimizePackageImports: ['@heroicons/react', 'lucide-react', 'recharts'],
  },
  // Vercel 배포 최적화 설정
  compress: true,
  poweredByHeader: false,
  // 빌드 최적화
  swcMinify: true,
  // ESLint 설정 - 빌드 시 경고는 무시하고 오류만 체크
  eslint: {
    // 빌드 시 ESLint 오류가 있어도 빌드 계속 진행
    ignoreDuringBuilds: false,
  },
  // TypeScript 설정 - 빌드 시 타입 오류가 있어도 빌드 계속 진행 (경고만 있는 경우)
  typescript: {
    // 빌드 시 TypeScript 오류가 있어도 빌드 계속 진행
    ignoreBuildErrors: false,
  },
  // 환경변수 검증은 app/lib/utils/env.ts에서 처리
  // NEXT_PUBLIC_ 접두사가 있는 변수만 클라이언트에 노출됨
  // 서버 전용 변수는 자동으로 제외됨
  // Vercel 배포 최적화
  // output: 'standalone', // Vercel에서는 자동으로 처리되므로 주석 처리
  // 웹팩 번들 최적화
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 클라이언트 번들 최적화
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // 큰 라이브러리를 별도 청크로 분리
            fullcalendar: {
              name: 'fullcalendar',
              test: /[\\/]node_modules[\\/]@fullcalendar[\\/]/,
              priority: 30,
              reuseExistingChunk: true,
            },
            recharts: {
              name: 'recharts',
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              priority: 30,
              reuseExistingChunk: true,
            },
            // 공통 라이브러리
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }
    return config
  },
}
module.exports = nextConfig
