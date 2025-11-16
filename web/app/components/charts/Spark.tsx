'use client'

import { lazy, Suspense } from 'react'
import { Skeleton } from '../ui/Skeleton'

// Recharts를 동적 import로 로드하여 번들 크기 감소
const SparkChart = lazy(() => import('recharts').then(recharts => {
  const { LineChart, Line, ResponsiveContainer } = recharts
  
  return {
    default: function SparkChartComponent({ data }: { data: { v: number }[] }) {
      return (
        <div className="h-10 w-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 0, right: 0, top: 2, bottom: 2 }}>
              <Line type="monotone" dataKey="v" stroke="var(--brand-500)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )
    }
  }
}))

export default function Spark({ data }: { data: { v: number }[] }) {
  return (
    <Suspense fallback={<div className="h-10 w-24 flex items-center justify-center"><Skeleton className="h-full w-full" /></div>}>
      <SparkChart data={data} />
    </Suspense>
  )
}


