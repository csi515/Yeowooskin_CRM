'use client'

import { lazy, Suspense } from 'react'
import { Skeleton } from '../ui/Skeleton'

// Recharts를 동적 import로 로드하여 번들 크기 감소
const DonutChart = lazy(() => import('recharts').then(recharts => {
  const { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } = recharts
  
  return {
    default: function DonutChartComponent({ data }: { data: { name: string; value: number }[] }) {
      const colors = ['var(--brand-500)', 'var(--brand-300)', 'var(--brand-700)']
      return (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )
    }
  }
}))

export default function Donut({ data }: { data: { name: string; value: number }[] }) {
  return (
    <Suspense fallback={<div className="h-72 w-full flex items-center justify-center"><Skeleton className="h-full w-full" /></div>}>
      <DonutChart data={data} />
    </Suspense>
  )
}


