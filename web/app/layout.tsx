import './globals.css'
import AppShell from './components/AppShell'
import Providers from './providers'
import { getEnv } from './lib/env'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // 환경변수는 빌드 타임에 검증되므로 안전하게 사용 가능
  const supabaseUrl = getEnv.supabaseUrl()
  const supabaseAnonKey = getEnv.supabaseAnonKey()
  
  return (
    <html lang="ko" className="h-full">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.14/main.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid@6.1.14/main.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fullcalendar/timegrid@6.1.14/main.min.css" />
        {/* 클라이언트에서 환경변수 접근을 위한 메타 태그 (fallback용) */}
        <meta name="x-supabase-url" content={supabaseUrl} />
        <meta name="x-supabase-anon" content={supabaseAnonKey} />
      </head>
      <body className="h-full font-sans bg-[var(--bg)] text-[color:var(--neutral-900)]">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}
