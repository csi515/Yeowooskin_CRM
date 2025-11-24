import { getUserIdFromCookies } from '@/lib/auth/user'
import { unstable_cache } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import Card from '../components/ui/Card'
import Monthly from '../components/charts/Monthly'
import MetricCard from '../components/MetricCard'
import DashboardInstallPrompt from '../components/dashboard/DashboardInstallPrompt'
import HQDashboardSummary from '../components/dashboard/HQDashboardSummary'
import DraggableDashboard from '../components/dashboard/DraggableDashboard'
import TodayScheduleWidget from '../components/dashboard/TodayScheduleWidget'
import type { Appointment, Product } from '@/types/entities'

function getTodayRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
  return { start, end }
}

function monthBounds() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { monthStart: monthStart.toISOString(), monthEnd: nextMonth.toISOString() }
}

// 캐싱된 KPI 조회 함수
// 주의: cookies()는 캐시 함수 밖에서 호출해야 합니다
const getCachedKpis = unstable_cache(
  async ({ start, end, userId, accessToken }: { start: string; end: string; userId: string; accessToken?: string }) => {
    // Supabase 클라이언트를 직접 생성 (cookies 사용하지 않음)
    const { getEnv } = await import('@/app/lib/env')
    const { createClient } = await import('@supabase/supabase-js')
    const url = getEnv.supabaseUrl()
    const anon = getEnv.supabaseAnonKey()
    
    if (!url || !anon) {
      throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
    }
    
    const supabase = createClient(url, anon, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      ...(accessToken && {
        global: {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      })
    })
    
    const { monthStart, monthEnd } = monthBounds()

  const [apRes, trRes, cuRes, apRecent, trRecent, exRecent, exMonth, trMonth, productsRes] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, appointment_date')
      .eq('owner_id', userId)
      .gte('appointment_date', start)
      .lt('appointment_date', end),
    supabase
      .from('transactions')
      .select('id, amount, transaction_date, created_at')
      .eq('owner_id', userId)
      .gte('transaction_date', start)
      .lt('transaction_date', end),
    supabase
      .from('customers')
      .select('id, created_at')
      .eq('owner_id', userId)
      .gte('created_at', start)
      .lt('created_at', end),
    supabase
      .from('appointments')
      .select('id, appointment_date, status, notes, customer_id, service_id')
      .eq('owner_id', userId)
      .order('appointment_date', { ascending: false })
      .limit(5),
    supabase
      .from('transactions')
      .select('id, amount, transaction_date, created_at, memo')
      .eq('owner_id', userId)
      .order('transaction_date', { ascending: false })
      .limit(5),
    supabase
      .from('expenses')
      .select('id, amount, expense_date, created_at, memo, category')
      .eq('owner_id', userId)
      .order('expense_date', { ascending: false })
      .limit(5),
    // 월간 집계용
    supabase.from('expenses').select('amount, expense_date').eq('owner_id', userId).gte('expense_date', monthStart).lt('expense_date', monthEnd),
    supabase.from('transactions').select('amount, transaction_date').eq('owner_id', userId).gte('transaction_date', monthStart).lt('transaction_date', monthEnd),
    supabase
      .from('products')
      .select('id, name, price, active')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
  ])

  const todayAppointments = Array.isArray(apRes.data) ? apRes.data.length : 0
  const todayRevenue = Array.isArray(trRes.data)
    ? trRes.data.reduce((s: number, t: { amount?: number }) => s + Number(t.amount || 0), 0)
    : 0
  const todayNewCustomers = Array.isArray(cuRes.data) ? cuRes.data.length : 0

  // 월간 시계열(주차별)
  const bucketByWeek = (dateIso: string): number => {
    if (!dateIso) return 0
    const d = new Date(dateIso)
    if (isNaN(d.getTime())) return 0
    const day = d.getDate()
    if (day <= 7) return 0
    if (day <= 14) return 1
    if (day <= 21) return 2
    if (day <= 28) return 3
    return 4
  }
  const incomeBuckets: number[] = [0, 0, 0, 0, 0]
  const expenseBuckets: number[] = [0, 0, 0, 0, 0]
  
  const trMonthData = Array.isArray(trMonth.data) ? trMonth.data : []
  const exMonthData = Array.isArray(exMonth.data) ? exMonth.data : []
  
  trMonthData.forEach((t: { transaction_date?: string; created_at?: string; amount?: number }) => {
    const dateStr = t.transaction_date || t.created_at || ''
    const bucket = bucketByWeek(dateStr)
    if (bucket >= 0 && bucket < incomeBuckets.length && incomeBuckets[bucket] !== undefined) {
      incomeBuckets[bucket] += Number(t.amount || 0)
    }
  })
  
  exMonthData.forEach((e: { expense_date?: string; amount?: number }) => {
    const dateStr = e.expense_date || ''
    const bucket = bucketByWeek(dateStr)
    if (bucket >= 0 && bucket < expenseBuckets.length && expenseBuckets[bucket] !== undefined) {
      expenseBuckets[bucket] += Number(e.amount || 0)
    }
  })
  
  const weeklyNames = ['1주', '2주', '3주', '4주', '5주']
  const monthlySeries = weeklyNames.map((name, i) => ({
    name,
    income: incomeBuckets[i] ?? 0,
    expense: expenseBuckets[i] ?? 0,
  }))

  // 판매중인 상품: active가 true이거나 null인 경우만 필터링 (기본값이 true로 간주)
  const activeProducts = Array.isArray(productsRes.data)
    ? productsRes.data.filter((p: { active?: boolean }) => p.active !== false)
    : []

  // 최근 예약: 고객 이름/시간/상품 이름으로 표시하기 위해 보조 조회
  const apRecentData = Array.isArray(apRecent.data) ? apRecent.data : []
  const apIds = apRecentData.map((a: { customer_id?: string; service_id?: string }) => ({
    customer_id: a.customer_id,
    service_id: a.service_id,
  }))
  const customerIds = Array.from(
    new Set(apIds.map((x) => x.customer_id).filter((id): id is string => Boolean(id)))
  )
  const serviceIds = Array.from(
    new Set(apIds.map((x) => x.service_id).filter((id): id is string => Boolean(id)))
  )
  const customersById: Record<string, string> = {}
  const productsById: Record<string, string> = {}
  
  if (customerIds.length > 0) {
    const { data } = await supabase
      .from('customers')
      .select('id,name')
      .in('id', customerIds)
    const customerData = Array.isArray(data) ? data : []
    customerData.forEach((c: { id: string; name: string }) => {
      if (c.id && c.name) {
        customersById[c.id] = c.name
      }
    })
  }
  
  if (serviceIds.length > 0) {
    const { data } = await supabase
      .from('products')
      .select('id,name')
      .in('id', serviceIds)
    const productData = Array.isArray(data) ? data : []
    productData.forEach((p: { id: string; name: string }) => {
      if (p.id && p.name) {
        productsById[p.id] = p.name
      }
    })
  }

  // 최근 거래: 수입과 지출을 합쳐서 날짜순으로 정렬
  const trRecentData = Array.isArray(trRecent.data) ? trRecent.data : []
  const exRecentData = Array.isArray(exRecent.data) ? exRecent.data : []
  
  const combinedTransactions = [
    ...trRecentData.map((t: { id: string; transaction_date?: string; created_at?: string; amount?: number; memo?: string }) => ({
      id: t.id,
      type: 'income' as const,
      date: t.transaction_date || t.created_at || '',
      amount: Number(t.amount || 0),
      memo: t.memo || '',
    })),
    ...exRecentData.map((e: { id: string; expense_date?: string; created_at?: string; amount?: number; memo?: string; category?: string }) => ({
      id: e.id,
      type: 'expense' as const,
      date: e.expense_date || e.created_at || '',
      amount: Number(e.amount || 0),
      memo: e.memo || e.category || '',
    })),
  ]
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA // 최신순
    })
    .slice(0, 5) // 최대 5개만

  return {
    todayAppointments,
    todayRevenue,
    todayNewCustomers,
    recentAppointments: apRecentData.map((a: { id: string; appointment_date: string; customer_id?: string; service_id?: string }) => ({
      id: a.id,
      appointment_date: a.appointment_date,
      customer_name: a.customer_id ? customersById[a.customer_id] || '-' : '-',
      product_name: a.service_id ? productsById[a.service_id] || '-' : '-',
    })),
    recentTransactions: combinedTransactions,
    monthlySeries,
    activeProducts,
  }
  },
  ['dashboard-kpis'],
  {
    revalidate: 300, // 5분간 캐시
    tags: ['dashboard'],
  }
)

async function getKpis({ start, end }: { start: string; end: string }) {
  // cookies()는 캐시 함수 밖에서 호출
  const { cookies } = await import('next/headers')
  const cookieStore = cookies()
  const userId = getUserIdFromCookies()
  const accessToken = cookieStore.get('sb:token')?.value || cookieStore.get('sb-access-token')?.value
  
  if (!userId) {
    return {
      todayAppointments: 0,
      todayRevenue: 0,
      todayNewCustomers: 0,
      recentAppointments: [],
      recentTransactions: [],
      monthlySeries: [],
      activeProducts: []
    }
  }

  // 캐싱된 함수 호출 (cookies 데이터를 인자로 전달)
  return getCachedKpis(accessToken ? { start, end, userId, accessToken } : { start, end, userId })
}

async function getUserRole(): Promise<'HQ' | 'OWNER' | 'STAFF' | null> {
  try {
    const userId = getUserIdFromCookies()
    if (!userId) return null

    const supabase = createSupabaseServerClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    return (profile?.role as 'HQ' | 'OWNER' | 'STAFF') || null
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const { start, end } = getTodayRange()
  const userRole = await getUserRole()
  const isHQ = userRole === 'HQ'
  
  const {
    todayAppointments,
    todayRevenue,
    todayNewCustomers,
    recentAppointments,
    recentTransactions,
    monthlySeries,
    activeProducts
  } = await getKpis({ start, end })

  return (
    <main className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* PWA 설치 프롬프트 */}
      <DashboardInstallPrompt />
      
      {/* HQ 전용 요약 카드 */}
      {isHQ && (
        <section>
          <HQDashboardSummary />
        </section>
      )}
      
      {/* 오늘의 일정 위젯 (모바일 최적화) */}
      <div className="md:hidden">
        <TodayScheduleWidget />
      </div>

      {/* 드래그 가능한 대시보드 위젯 */}
      <DraggableDashboard
        todayAppointments={todayAppointments}
        todayRevenue={todayRevenue}
        todayNewCustomers={todayNewCustomers}
        monthlySeries={monthlySeries}
        activeProducts={activeProducts}
      />

      {/* 최근 예약 / 최근 거래 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
        <Card>
          <div className="p-3 sm:p-4 border-b border-purple-100">
            <h2 className="text-sm sm:text-base font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">최근 예약</h2>
          </div>
          <ul className="divide-y divide-neutral-100">
            {recentAppointments.map((a: { id: string; appointment_date: string; customer_name: string; product_name: string }) => (
              <li
                key={a.id}
                className="p-3 sm:p-4 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 touch-manipulation min-h-[44px]"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-neutral-900 font-medium truncate">
                    {a.customer_name}
                  </div>
                  <div className="text-xs text-neutral-600 truncate">
                    {a.product_name}
                  </div>
                </div>
                <span className="text-xs sm:text-sm text-neutral-500 flex-shrink-0">
                  {String(a.appointment_date)
                    .slice(5, 16)
                    .replace('T', ' ')}
                </span>
              </li>
            ))}
            {recentAppointments.length === 0 && (
              <li className="p-6">
                <div className="text-sm text-neutral-500">
                  <a className="underline hover:text-pink-600 touch-manipulation" href="/appointments">
                    데이터가 없습니다 · 첫 예약 추가
                  </a>
                </div>
              </li>
            )}
          </ul>
        </Card>
        <Card>
          <div className="p-3 sm:p-4 border-b border-purple-100">
            <h2 className="text-sm sm:text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">최근 거래</h2>
          </div>
          <ul className="divide-y divide-neutral-100">
            {recentTransactions.map((t: { id: string; type: 'income' | 'expense'; date: string; amount: number; memo: string }) => {
              const dateLabel = String(t.date || '')
                .replace('T', ' ')
                .slice(5, 16)
              const isExpense = t.type === 'expense'
              return (
                <li
                  key={`${t.type}-${t.id}`}
                  className="p-3 sm:p-4 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 touch-manipulation min-h-[44px]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                        isExpense 
                          ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {isExpense ? '지출' : '수입'}
                      </span>
                      <div className="font-medium text-neutral-900 truncate">
                        {t.memo || '-'}
                      </div>
                    </div>
                    <div className="text-xs text-neutral-500">
                      {dateLabel}
                    </div>
                  </div>
                  <div className={`font-semibold whitespace-nowrap text-base sm:text-sm flex-shrink-0 ${
                    isExpense ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {isExpense ? '-' : '+'}₩{Number(t.amount || 0).toLocaleString()}
                  </div>
                </li>
              )
            })}
            {recentTransactions.length === 0 && (
              <li className="p-6">
                <div className="text-sm text-neutral-500">
                  <a className="underline hover:text-blue-600 touch-manipulation" href="/finance">
                    데이터가 없습니다 · 첫 거래 추가
                  </a>
                </div>
              </li>
            )}
          </ul>
        </Card>
      </section>
    </main>
  )
}


