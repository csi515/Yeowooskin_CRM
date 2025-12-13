

// app/dashboard/page.tsx - Rewritten
// app/dashboard/page.tsx - Rewritten
import Card from '../components/ui/Card'
import MetricCard from '../components/MetricCard'
import DashboardInstallPrompt from '../components/dashboard/DashboardInstallPrompt'
import Link from 'next/link'

// Remove caching references and server-side logic that might be causing issues
// We will move to client-side fetching for the dashboard to ensure 100% freshness as per user request ("not reflected")
// Actually, server components are fine if we opt out of cache. 
// But checking the file, it was a Server Component.
// Let's keep it Server Component but remove caching to ensure freshness on every request.

// Wait, the user said "Dashboard ... is not reflected". 
// A server component without cache is fresh on refresh. 
// If they want it to update *without* refresh (e.g. navigating back), we rely on Next.js router cache invalidation.
// Removing `unstable_cache` is the big fix.

import { getUserIdFromCookies } from '@/lib/auth/user'
import { cookies } from 'next/headers'

// Define types locally if needed, or import
// reuse existing logic but stripped of cache

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

async function getDashboardData({ start, end, userId, accessToken }: { start: string; end: string; userId: string; accessToken?: string | undefined }) {
  // Use server-side supabase client (or just use the one we construct manually to avoid middleware issues if any)
  // The original code constructed it manually. We can stick to that or use createServerClient if available.
  // Sticking to original manual construction to minimize risk.
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
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
    }
  })

  const { monthStart, monthEnd } = monthBounds()
  const fromDate = monthStart.slice(0, 10)
  const toDate = monthEnd.slice(0, 10)

  // Combined fetch
  const [apRes, , , cuMonth, apRecent, trRecent, exRecent, exMonth, trMonth, productsRes] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, appointment_date')
      .eq('owner_id', userId)
      .gte('appointment_date', start)
      .lt('appointment_date', end),
    // Removed transactions range query as it was only for stats we might not need or simple counts
    // Actually we need 'transactions' for something? 
    // The original code had:
    // 1. apRes (Today appointments)
    // 2. trRes (Today transactions - for what? wasn't used in visible stats? wait, MetricCard 'Today Sale'?)
    //    Original code: 
    //      supabase.from('transactions').select(...).gte(start).lt(end)
    //    It *was* fetching today transactions but I don't see it used in the UI for "Today's Income".
    //    The UI has: Today Appointments, Monthly Profit, Monthly New Customers. 
    //    So Today's Transactions query (index 1) might be unused. Let's keep it null/placeholder to match destructuring or just fetch it.
    //    Optimizing: The original index 1 was 'transactions' today.
    supabase.from('transactions').select('id').eq('owner_id', userId).gte('transaction_date', start).lt('transaction_date', end), // Minimal fetch

    supabase
      .from('customers')
      .select('id, created_at')
      .eq('owner_id', userId)
      .gte('created_at', start)
      .lt('created_at', end),
    // Monthly New Customers
    supabase
      .from('customers')
      .select('id, created_at')
      .eq('owner_id', userId)
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd),
    // Recent Appointments
    supabase
      .from('appointments')
      .select('id, appointment_date, status, notes, customer_id, service_id')
      .eq('owner_id', userId)
      .order('appointment_date', { ascending: false })
      .limit(5),
    // Recent Transactions
    supabase
      .from('transactions')
      .select('id, amount, transaction_date, created_at, memo')
      .eq('owner_id', userId)
      .order('transaction_date', { ascending: false })
      .limit(5),
    // Recent Expenses
    supabase
      .from('expenses')
      .select('id, amount, expense_date, created_at, memo, category')
      .eq('owner_id', userId)
      .order('expense_date', { ascending: false })
      .limit(5),
    // Monthly Expenses (for Profit)
    supabase.from('expenses').select('amount, expense_date').eq('owner_id', userId).gte('expense_date', fromDate).lte('expense_date', toDate),
    // Monthly Transactions (for Profit)
    supabase.from('transactions').select('amount, transaction_date, created_at').eq('owner_id', userId).limit(500),
    // Products
    supabase
      .from('products')
      .select('id, name, price, active')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
  ])

  const todayAppointments = Array.isArray(apRes.data) ? apRes.data.length : 0

  // Monthly Profit
  const monthlyIncome = Array.isArray(trMonth.data)
    ? trMonth.data
      .filter((t: any) => {
        const d = (t.transaction_date || t.created_at || '').slice(0, 10)
        return (!fromDate || d >= fromDate) && (!toDate || d <= toDate)
      })
      .reduce((s: number, t: any) => s + Number(t.amount || 0), 0)
    : 0

  const monthlyExpense = Array.isArray(exMonth.data)
    ? exMonth.data.reduce((s: number, e: any) => s + Number(e.amount || 0), 0)
    : 0

  const monthlyProfit = monthlyIncome - monthlyExpense

  const monthlyNewCustomers = Array.isArray(cuMonth.data) ? cuMonth.data.length : 0

  // Active products
  const activeProducts = Array.isArray(productsRes.data)
    ? productsRes.data.filter((p: any) => p.active !== false)
    : []

  // Recent Appointments helper
  const apRecentData = Array.isArray(apRecent.data) ? apRecent.data : []
  const apIds = apRecentData.map((a: any) => ({
    customer_id: a.customer_id,
    service_id: a.service_id,
  }))
  const cIds = Array.from(new Set(apIds.map(x => x.customer_id).filter(Boolean))) as string[]
  const sIds = Array.from(new Set(apIds.map(x => x.service_id).filter(Boolean))) as string[]

  const customersById: Record<string, string> = {}
  const productsById: Record<string, string> = {}

  if (cIds.length > 0) {
    const { data } = await supabase.from('customers').select('id,name').in('id', cIds)
    if (data) data.forEach((c: any) => customersById[c.id] = c.name)
  }
  if (sIds.length > 0) {
    const { data } = await supabase.from('products').select('id,name').in('id', sIds)
    if (data) data.forEach((p: any) => productsById[p.id] = p.name)
  }

  // Combined Transactions
  const trData = Array.isArray(trRecent.data) ? trRecent.data : []
  const exData = Array.isArray(exRecent.data) ? exRecent.data : []
  const combinedTransactions = [
    ...trData.map((t: any) => ({
      id: t.id,
      type: 'income' as const,
      date: t.transaction_date || t.created_at,
      amount: Number(t.amount),
      memo: t.memo
    })),
    ...exData.map((e: any) => ({
      id: e.id,
      type: 'expense' as const,
      date: e.expense_date || e.created_at,
      amount: Number(e.amount),
      memo: e.memo || e.category
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  return {
    todayAppointments,
    monthlyProfit,
    monthlyNewCustomers,
    recentAppointments: apRecentData.map((a: any) => ({
      id: a.id,
      appointment_date: a.appointment_date,
      customer_name: a.customer_id ? customersById[a.customer_id] || '-' : '-',
      product_name: a.service_id ? productsById[a.service_id] || '-' : '-',
    })),
    recentTransactions: combinedTransactions,
    activeProducts
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const userId = await getUserIdFromCookies()
  const accessToken = cookieStore.get('sb:token')?.value || cookieStore.get('sb-access-token')?.value

  // If no user, return empty skeleton or redirect (middleware handles redirect usually)
  if (!userId) {
    return <main className="p-4">Loading...</main> // Should not happen if protected
  }

  const { start, end } = getTodayRange()

  // Directly fetch data without caching
  let dashboardData
  if (userId === 'demo-user') {
    dashboardData = (await import('@/app/lib/mock-data')).MOCK_DASHBOARD_DATA
  } else {
    dashboardData = await getDashboardData({ start, end, userId, accessToken })
  }

  const {
    todayAppointments,
    monthlyProfit,
    monthlyNewCustomers,
    recentAppointments,
    recentTransactions,
    activeProducts
  } = dashboardData

  return (
    <main className="space-y-4 sm:space-y-5 md:space-y-6">
      <DashboardInstallPrompt />

      {userId === 'demo-user' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm mb-4 shadow-sm flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>현재 <strong>체험하기(데모) 모드</strong>입니다. 표시되는 데이터는 예시이며, 실제 데이터베이스와 연동되지 않습니다.</span>
        </div>
      )}

      {/* Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        <MetricCard
          label="오늘 예약"
          value={todayAppointments}
          hint="오늘 기준"
          className="h-full"
          colorIndex={0}
        />
        <MetricCard
          label="월간 순이익"
          value={`₩${Number(monthlyProfit).toLocaleString()}`}
          hint="이번 달 기준"
          className="h-full"
          colorIndex={1}
        />
        <MetricCard
          label="이번달 신규 고객"
          value={monthlyNewCustomers}
          hint="이번 달 기준"
          className="h-full sm:col-span-2 lg:col-span-1"
          colorIndex={2}
        />
      </section>

      {/* Products Only (Graph Removed) */}
      <section className="grid grid-cols-1">
        <Card className="p-4 sm:p-5">
          <div className="text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
            판매중인 상품
          </div>
          <div className="space-y-2 max-h-[240px] sm:max-h-[200px] overflow-y-auto overscroll-contain">
            {activeProducts.length > 0 ? (
              activeProducts.slice(0, 5).map((p: any, index: number) => (
                <div
                  key={p.id}
                  className={`text-xs sm:text-sm py-2 px-3 rounded-md flex items-center justify-between gap-2 touch-manipulation ${index % 2 === 0 ? 'bg-emerald-50/50' : 'bg-teal-50/50'
                    }`}
                >
                  <span className="font-medium text-neutral-800 truncate flex-1 min-w-0">{p.name}</span>
                  <span className="text-emerald-700 font-semibold whitespace-nowrap flex-shrink-0">
                    ₩{Number(p.price || 0).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs sm:text-sm text-neutral-500 py-3">
                <Link className="underline hover:text-emerald-600 touch-manipulation" href="/products">
                  상품 추가
                </Link>
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* Recent Lists */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
        <Card>
          <div className="p-3 sm:p-4 border-b border-purple-100">
            <h2 className="text-sm sm:text-base font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">최근 예약</h2>
          </div>
          <ul className="divide-y divide-neutral-100">
            {recentAppointments.length > 0 ? recentAppointments.map((a: any) => (
              <li
                key={a.id}
                className="p-3 sm:p-4 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 touch-manipulation"
              >
                <span className="text-neutral-900 font-medium">
                  {a.customer_name} · {a.product_name}
                </span>
                <span className="text-xs sm:text-sm text-neutral-500">
                  {String(a.appointment_date).slice(0, 16).replace('T', ' ')}
                </span>
              </li>
            )) : (
              <li className="p-6">
                <div className="text-sm text-neutral-500">
                  <Link className="underline hover:text-pink-600 touch-manipulation" href="/appointments">
                    데이터가 없습니다 · 첫 예약 추가
                  </Link>
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
            {recentTransactions.map((t: any) => {
              const header = t.type === 'expense' ? '지출' : '수입'
              const colorClass = t.type === 'expense'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              const amtColor = t.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'
              const sign = t.type === 'expense' ? '-' : '+'

              return (
                <li
                  key={`${t.type}-${t.id}`}
                  className="p-3 sm:p-4 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 touch-manipulation"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium flex-shrink-0 ${colorClass}`}>
                        {header}
                      </span>
                      <span className="font-medium text-neutral-900 truncate">
                        {t.memo || '-'}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500">
                      {String(t.date || '').slice(0, 16).replace('T', ' ')}
                    </div>
                  </div>
                  <div className={`font-semibold whitespace-nowrap text-base sm:text-sm flex-shrink-0 ${amtColor}`}>
                    {sign}₩{Number(t.amount || 0).toLocaleString()}
                  </div>
                </li>
              )
            })}
            {recentTransactions.length === 0 && (
              <li className="p-6">
                <div className="text-sm text-neutral-500">
                  <Link className="underline hover:text-blue-600 touch-manipulation" href="/finance">
                    데이터가 없습니다 · 첫 거래 추가
                  </Link>
                </div>
              </li>
            )}
          </ul>
        </Card>
      </section>
    </main>
  )
}
