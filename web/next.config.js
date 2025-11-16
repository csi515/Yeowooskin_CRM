/**** Next.js config ****/
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { 
    domains: [],
    // Vercel 최적화를 위한 이미지 설정
    formats: ['image/avif', 'image/webp'],
  },
  experimental: { 
    serverActions: { 
      bodySizeLimit: '2mb' 
    },
    // 번들 크기 최적화
    optimizePackageImports: ['@chakra-ui/react', '@heroicons/react', 'lucide-react'],
  },
  // Vercel 배포 최적화 설정
  compress: true,
  poweredByHeader: false,
  // 빌드 최적화
  swcMinify: true,
  // 환경변수 검증 (빌드 시점)
  env: {
    // NEXT_PUBLIC_ 접두사가 있는 변수만 클라이언트에 노출됨
    // 서버 전용 변수는 자동으로 제외됨
  },
  // Vercel Edge Runtime 호환성
  output: 'standalone',
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
            chakra: {
              name: 'chakra-ui',
              test: /[\\/]node_modules[\\/]@chakra-ui[\\/]/,
              priority: 20,
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
