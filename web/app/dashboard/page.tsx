import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getUserIdFromCookies } from '@/lib/auth/user'
import Card from '../components/ui/Card'
import Monthly from '../components/charts/Monthly'
import MetricCard from '../components/MetricCard'
import PageHeader from '../components/PageHeader'
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

  const [apRes, trRes, cuRes, apRecent, trRecent, exMonth, trMonth, productsRes] = await Promise.all([
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
    // 월간 집계용
    supabase.from('expenses').select('amount, expense_date').eq('owner_id', userId).gte('expense_date', monthStart).lt('expense_date', monthEnd),
    supabase.from('transactions').select('amount, transaction_date').eq('owner_id', userId).gte('transaction_date', monthStart).lt('transaction_date', monthEnd),
    supabase
      .from('products')
      .select('id, name, price, active')
      .eq('owner_id', userId)
      .eq('active', true)
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

  // 판매중인 상품
  const activeProducts = Array.isArray(productsRes.data) ? productsRes.data : []

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
    recentTransactions: trRecent.data || [],
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
    <main className="space-y-8">
      <PageHeader
        title="대시보드"
        subtitle="오늘의 예약, 매출, 고객 현황과 월간 수입·지출 흐름을 한눈에 확인하세요."
      />

      <div className="space-y-8">

        {/* 핵심 지표 카드 */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <MetricCard
            label="오늘 예약"
            value={todayAppointments}
            hint="오늘 기준"
            className="h-full"
          />
          <MetricCard
            label="오늘 매출"
            value={`₩${Number(todayRevenue).toLocaleString()}`}
            className="h-full"
          />
          <MetricCard
            label="오늘 신규 고객"
            value={todayNewCustomers}
            className="h-full"
          />
        </section>

        {/* 그래프 & 판매중인 상품 */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <div className="text-sm font-semibold text-neutral-800 mb-3">
              이번 달 수입/지출
            </div>
            <Monthly data={monthlySeries} />
          </Card>
          <Card className="p-5">
            <div className="text-sm font-semibold text-neutral-800 mb-3">
              판매중인 상품
            </div>
            <ul className="divide-y divide-neutral-100">
              {activeProducts.map((p: any) => (
                <li
                  key={p.id}
                  className="py-3 text-sm flex items-center justify-between"
                >
                  <span className="font-medium text-neutral-900">{p.name}</span>
                  <span className="text-neutral-500">
                    ₩{Number(p.price || 0).toLocaleString()}
                  </span>
                </li>
              ))}
              {activeProducts.length === 0 && (
                <li className="py-4 text-sm text-neutral-500">
                  <a className="underline" href="/products">
                    판매중인 상품이 없습니다 · 상품 추가
                  </a>
                </li>
              )}
            </ul>
          </Card>
        </section>

        {/* 최근 예약 / 최근 거래 */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <div className="p-4 border-b border-neutral-100">
              <h2 className="text-sm font-semibold text-neutral-800">최근 예약</h2>
            </div>
            <ul className="divide-y divide-neutral-100">
              {recentAppointments.map((a: any) => (
                <li
                  key={a.id}
                  className="p-4 text-sm flex items-center justify-between"
                >
                  <span className="text-neutral-900">
                    {a.customer_name} · {a.product_name}
                  </span>
                  <span className="text-neutral-500">
                    {String(a.appointment_date)
                      .slice(0, 16)
                      .replace('T', ' ')}
                  </span>
                </li>
              ))}
              {recentAppointments.length === 0 && (
                <li className="p-6">
                  <div className="text-sm text-neutral-500">
                    <a className="underline" href="/appointments">
                      데이터가 없습니다 · 첫 예약 추가
                    </a>
                  </div>
                </li>
              )}
            </ul>
          </Card>
          <Card>
            <div className="p-4 border-b border-neutral-100">
              <h2 className="text-sm font-semibold text-neutral-800">최근 거래</h2>
            </div>
            <ul className="divide-y divide-neutral-100">
              {recentTransactions.map((t: any) => {
                const dateLabel = String(
                  t.transaction_date || t.created_at || '',
                )
                  .replace('T', ' ')
                  .slice(0, 16)
                return (
                  <li
                    key={t.id}
                    className="p-4 text-sm flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-neutral-900 truncate">
                        {t.memo || '-'}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {dateLabel}
                      </div>
                    </div>
                    <div className="text-neutral-900 font-semibold whitespace-nowrap">
                      ₩{Number(t.amount || 0).toLocaleString()}
                    </div>
                  </li>
                )
              })}
              {recentTransactions.length === 0 && (
                <li className="p-6">
                  <div className="text-sm text-neutral-500">
                    <a className="underline" href="/finance">
                      데이터가 없습니다 · 첫 거래 추가
                    </a>
                  </div>
                </li>
              )}
            </ul>
          </Card>
        </section>
      </div>
    </main>
  )
}


