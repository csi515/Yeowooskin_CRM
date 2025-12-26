import { cookies } from 'next/headers'
import { getUserIdFromCookies } from '@/lib/auth/user'
import { Box } from '@mui/material'
import DashboardContent from './DashboardContent'

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

  try {
    // Combined fetch
    const [apRes, , , cuMonth, apRecent, trRecent, exRecent, exMonth, trMonth, productsRes, apMonthRes, apStatsRes] = await Promise.all([
      supabase
        .from('appointments')
        .select('id, appointment_date')
        .eq('owner_id', userId)
        .gte('appointment_date', start)
        .lt('appointment_date', end),
      supabase.from('transactions').select('id').eq('owner_id', userId).gte('transaction_date', start).lt('transaction_date', end),

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
        .limit(10),
      // Recent Transactions
      supabase
        .from('transactions')
        .select('id, amount, transaction_date, created_at, memo')
        .eq('owner_id', userId)
        .order('transaction_date', { ascending: false })
        .limit(10),
      // Recent Expenses
      supabase
        .from('expenses')
        .select('id, amount, expense_date, created_at, memo, category')
        .eq('owner_id', userId)
        .order('expense_date', { ascending: false })
        .limit(10),
      // Monthly Expenses (for Profit)
      supabase.from('expenses').select('id, amount, expense_date').eq('owner_id', userId).gte('expense_date', fromDate).lte('expense_date', toDate),
      // Monthly Transactions (for Profit)
      supabase.from('transactions').select('id, amount, transaction_date, created_at').eq('owner_id', userId).limit(500),
      // Products
      supabase
        .from('products')
        .select('id, name, price, active')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
      // Monthly Appointments Count
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .gte('appointment_date', monthStart)
        .lte('appointment_date', monthEnd),
      // Stats Appointments (for Top Services)
      supabase
        .from('appointments')
        .select('id, service_id')
        .eq('owner_id', userId)
        .order('appointment_date', { ascending: false })
        .limit(100)
    ])

    const todayAppointments = Array.isArray(apRes.data) ? apRes.data.length : 0
    const monthlyAppointments = apMonthRes.count || 0

    // Monthly Profit
    const monthlyIncome = Array.isArray(trMonth.data)
      ? (trMonth.data as any[])
        .filter((t) => {
          const d = (t.transaction_date || t.created_at || '').slice(0, 10)
          return (!fromDate || d >= fromDate) && (!toDate || d <= toDate)
        })
        .reduce((s: number, t) => s + Number(t.amount || 0), 0)
      : 0

    const monthlyExpense = Array.isArray(exMonth.data)
      ? (exMonth.data as any[]).reduce((s: number, e) => s + Number(e.amount || 0), 0)
      : 0

    const monthlyProfit = Number(monthlyIncome || 0) - Number(monthlyExpense || 0)

    const monthlyNewCustomers = Array.isArray(cuMonth.data) ? cuMonth.data.length : 0

    // Active products
    const activeProducts = Array.isArray(productsRes.data)
      ? productsRes.data.filter((p: any) => p.active !== false)
      : []

    // Recent Appointments helper
    const apRecentData = Array.isArray(apRecent.data) ? apRecent.data : []
    const apStatsData = Array.isArray(apStatsRes.data) ? apStatsRes.data : []

    const apIds = apRecentData.map((a: any) => ({
      customer_id: a.customer_id,
      service_id: a.service_id,
    }))
    const statsIds = apStatsData.map((a: any) => ({
      service_id: a.service_id
    }))

    const cIds = Array.from(new Set(apIds.map(x => x.customer_id).filter(Boolean))) as string[]
    const sIds = Array.from(new Set([...apIds, ...statsIds].map(x => x.service_id).filter(Boolean))) as string[]

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
        date: t.transaction_date || t.created_at || '',
        amount: Number(t.amount),
        memo: undefined
      })),
      ...exData.map((e: any) => ({
        id: e.id,
        type: 'expense' as const,
        date: e.expense_date || e.created_at || '',
        amount: Number(e.amount),
        memo: e.memo || e.category
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

    return {
      todayAppointments,
      monthlyProfit,
      monthlyNewCustomers,
      monthlyAppointments,
      recentAppointments: apRecentData.map((a: any) => ({
        id: a.id,
        appointment_date: a.appointment_date,
        customer_name: a.customer_id ? customersById[a.customer_id] || '-' : '-',
        product_name: a.service_id ? productsById[a.service_id] || '-' : '-',
      })),
      chartAppointments: apStatsData.map((a: any) => ({
        product_name: a.service_id ? productsById[a.service_id] || '-' : '-',
      })),
      recentTransactions: combinedTransactions,
      monthlyRevenueData: Array.isArray(trMonth.data) ? trMonth.data.map((t: any) => ({
        id: t.id,
        amount: Number(t.amount),
        transaction_date: t.transaction_date || t.created_at,
        type: 'income',
        owner_id: userId
      })) : [],
      activeProducts
    }
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
    return {
      todayAppointments: 0,
      monthlyProfit: 0,
      monthlyNewCustomers: 0,
      monthlyAppointments: 0,
      recentAppointments: [],
      chartAppointments: [],
      recentTransactions: [],
      monthlyRevenueData: [],
      activeProducts: []
    }
  }
}

export default async function DashboardPage() {
  const cookieStore = cookies()
  const userId = await getUserIdFromCookies()
  const accessToken = cookieStore.get('sb:token')?.value || cookieStore.get('sb-access-token')?.value

  if (!userId) {
    return <Box p={3}>Loading...</Box>
  }

  const { start, end } = getTodayRange()

  return (
    <DashboardContent start={start} end={end} userId={userId} accessToken={accessToken} fetchData={getDashboardData} />
  )
}
