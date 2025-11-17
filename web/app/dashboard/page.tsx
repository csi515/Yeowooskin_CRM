import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getUserIdFromCookies } from '@/lib/auth/user'
import Card from '../components/ui/Card'
import Monthly from '../components/charts/Monthly'
import MetricCard from '../components/MetricCard'
import type { Transaction, Expense, Appointment, Customer, Product } from '@/types/entities'

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

async function getKpis({ start, end }: { start: string; end: string }) {
  const supabase = createSupabaseServerClient()
  const userId = getUserIdFromCookies()
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
    ? trRes.data.reduce((s: number, t: any) => s + Number(t.amount || 0), 0)
    : 0
  const todayNewCustomers = Array.isArray(cuRes.data) ? cuRes.data.length : 0

  // 월간 시계열(주차별)
  const bucketByWeek = (dateIso: string) => {
    const d = new Date(dateIso)
    const day = d.getDate()
    if (day <= 7) return 0
    if (day <= 14) return 1
    if (day <= 21) return 2
    if (day <= 28) return 3
    return 4
  }
  const incomeBuckets = [0,0,0,0,0]
  const expenseBuckets = [0,0,0,0,0]
  ;(trMonth.data || []).forEach((t: any) => { const b = bucketByWeek(t.transaction_date || t.created_at || ''); incomeBuckets[b] += Number(t.amount || 0) })
  ;(exMonth.data || []).forEach((e: any) => { const b = bucketByWeek(e.expense_date || ''); expenseBuckets[b] += Number(e.amount || 0) })
  const weeklyNames = ['1주','2주','3주','4주','5주']
  const monthlySeries = weeklyNames.map((name, i) => ({ name, income: incomeBuckets[i], expense: expenseBuckets[i] }))

  // 판매중인 상품: active가 true이거나 null인 경우만 필터링 (기본값이 true로 간주)
  const activeProducts = Array.isArray(productsRes.data) 
    ? productsRes.data.filter((p: any) => p.active !== false)
    : []

  // 최근 예약: 고객 이름/시간/상품 이름으로 표시하기 위해 보조 조회
  const apIds = (apRecent.data || [])
    .map((a: any) => ({ customer_id: a.customer_id, service_id: a.service_id }))
  const customerIds = Array.from(new Set(apIds.map(x => x.customer_id).filter(Boolean))) as string[]
  const serviceIds = Array.from(new Set(apIds.map(x => x.service_id).filter(Boolean))) as string[]
  let customersById: Record<string,string> = {}
  let productsById: Record<string,string> = {}
  if (customerIds.length) {
    const { data } = await supabase.from('customers').select('id,name').in('id', customerIds)
    ;(data || []).forEach((c: any) => { customersById[c.id] = c.name })
  }
  if (serviceIds.length) {
    const { data } = await supabase.from('products').select('id,name').in('id', serviceIds)
    ;(data || []).forEach((p: any) => { productsById[p.id] = p.name })
  }

  // 최근 거래: 수입과 지출을 합쳐서 날짜순으로 정렬
  const combinedTransactions = [
    ...(trRecent.data || []).map((t: any) => ({
      id: t.id,
      type: 'income' as const,
      date: t.transaction_date || t.created_at || '',
      amount: Number(t.amount || 0),
      memo: t.memo || '',
    })),
    ...(exRecent.data || []).map((e: any) => ({
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
    recentAppointments: (apRecent.data || []).map((a: any) => ({
      id: a.id,
      appointment_date: a.appointment_date,
      customer_name: a.customer_id ? (customersById[a.customer_id] || '-') : '-',
      product_name: a.service_id ? (productsById[a.service_id] || '-') : '-',
    })),
    recentTransactions: combinedTransactions,
    monthlySeries,
    activeProducts
  }
}

export default async function DashboardPage() {
  const { start, end } = getTodayRange()
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
    <main className="space-y-4 md:space-y-5 lg:space-y-6">
      {/* 핵심 지표 카드 - 반응형 그리드 */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
        <MetricCard
          label="오늘 예약"
          value={todayAppointments}
          hint="오늘 기준"
          className="h-full"
          colorIndex={0}
        />
        <MetricCard
          label="오늘 매출"
          value={`₩${Number(todayRevenue).toLocaleString()}`}
          className="h-full"
          colorIndex={1}
        />
        <MetricCard
          label="오늘 신규 고객"
          value={todayNewCustomers}
          className="h-full sm:col-span-2 lg:col-span-1"
          colorIndex={2}
        />
      </section>

      {/* 그래프 & 판매중인 상품 - 반응형 레이아웃 */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
        <Card className="p-4 md:p-5 lg:p-6 lg:col-span-2">
          <div className="text-base md:text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            이번 달 수입/지출
          </div>
          <div className="h-64 md:h-80">
            <Monthly data={monthlySeries} />
          </div>
        </Card>
        <Card className="p-4 md:p-5">
          <div className="text-sm md:text-base font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
            판매중인 상품
          </div>
          <div className="space-y-2 max-h-[300px] md:max-h-[400px] overflow-y-auto">
            {activeProducts.length > 0 ? (
              activeProducts.slice(0, 5).map((p: any, index: number) => (
                <div
                  key={p.id}
                  className={`text-sm py-2 px-3 rounded-lg flex items-center justify-between transition-colors ${
                    index % 2 === 0 ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'bg-teal-50/50 hover:bg-teal-50'
                  }`}
                >
                  <span className="font-medium text-neutral-800 truncate flex-1 min-w-0">{p.name}</span>
                  <span className="text-emerald-700 font-semibold ml-3 whitespace-nowrap">
                    ₩{Number(p.price || 0).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-neutral-500 py-4 text-center">
                <a className="underline hover:text-emerald-600 transition-colors" href="/products">
                  상품 추가
                </a>
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* 최근 예약 / 최근 거래 - 반응형 그리드 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 lg:gap-6">
        <Card className="overflow-hidden">
          <div className="p-4 md:p-5 border-b border-neutral-200 bg-neutral-50">
            <h2 className="text-base md:text-lg font-semibold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              최근 예약
            </h2>
          </div>
          <ul className="divide-y divide-neutral-100">
            {recentAppointments.length > 0 ? (
              recentAppointments.map((a: any) => (
                <li
                  key={a.id}
                  className="p-4 md:p-5 text-sm md:text-base flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-neutral-50 transition-colors"
                >
                  <span className="text-neutral-900 font-medium">
                    {a.customer_name} · {a.product_name}
                  </span>
                  <span className="text-neutral-500 text-xs sm:text-sm">
                    {String(a.appointment_date)
                      .slice(0, 16)
                      .replace('T', ' ')}
                  </span>
                </li>
              ))
            ) : (
              <li className="p-6 md:p-8">
                <div className="text-sm md:text-base text-neutral-500 text-center">
                  <a className="underline hover:text-pink-600 transition-colors" href="/appointments">
                    데이터가 없습니다 · 첫 예약 추가
                  </a>
                </div>
              </li>
            )}
          </ul>
        </Card>
        <Card className="overflow-hidden">
          <div className="p-4 md:p-5 border-b border-neutral-200 bg-neutral-50">
            <h2 className="text-base md:text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              최근 거래
            </h2>
          </div>
          <ul className="divide-y divide-neutral-100">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((t: any) => {
                const dateLabel = String(t.date || '')
                  .replace('T', ' ')
                  .slice(0, 16)
                const isExpense = t.type === 'expense'
                return (
                  <li
                    key={`${t.type}-${t.id}`}
                    className="p-4 md:p-5 text-sm md:text-base flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${
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
                      <div className="text-xs text-neutral-500 mt-1.5">
                        {dateLabel}
                      </div>
                    </div>
                    <div className={`font-semibold whitespace-nowrap text-base ${
                      isExpense ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      {isExpense ? '-' : '+'}₩{Number(t.amount || 0).toLocaleString()}
                    </div>
                  </li>
                )
              })
            ) : (
              <li className="p-6 md:p-8">
                <div className="text-sm md:text-base text-neutral-500 text-center">
                  <a className="underline hover:text-blue-600 transition-colors" href="/finance">
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
