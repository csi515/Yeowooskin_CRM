'use client'

import { useState } from 'react'
import { useLocalStorage } from '@/app/lib/hooks/useLocalStorage'
import Card from '../ui/Card'
import MetricCard from '../MetricCard'
import Monthly from '../charts/Monthly'

type WidgetType = 'metrics' | 'chart' | 'products' | 'recent'

interface Widget {
  id: string
  type: WidgetType
  order: number
  visible: boolean
}

interface DraggableDashboardProps {
  todayAppointments: number
  todayRevenue: number
  todayNewCustomers: number
  monthlySeries: Array<{ date: string; income: number; expense: number }>
  activeProducts: Array<{ id: string; name: string; price?: number }>
}

const defaultWidgets: Widget[] = [
  { id: 'metrics', type: 'metrics', order: 0, visible: true },
  { id: 'chart', type: 'chart', order: 1, visible: true },
  { id: 'products', type: 'products', order: 2, visible: true },
]

export default function DraggableDashboard({
  todayAppointments,
  todayRevenue,
  todayNewCustomers,
  monthlySeries,
  activeProducts,
}: DraggableDashboardProps) {
  const [widgets, setWidgets] = useLocalStorage<Widget[]>('dashboard-widgets', defaultWidgets)
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)

  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order).filter((w) => w.visible)

  const handleDragStart = (widgetId: string) => {
    setDraggedWidget(widgetId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetWidgetId: string) => {
    if (!draggedWidget || draggedWidget === targetWidgetId) return

    const dragged = widgets.find((w) => w.id === draggedWidget)
    const target = widgets.find((w) => w.id === targetWidgetId)

    if (!dragged || !target) return

    const newWidgets = widgets.map((w) => {
      if (w.id === draggedWidget) return { ...w, order: target.order }
      if (w.id === targetWidgetId) return { ...w, order: dragged.order }
      return w
    })

    setWidgets(newWidgets)
    setDraggedWidget(null)
  }

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {sortedWidgets.map((widget) => {
        if (widget.type === 'metrics') {
          return (
            <div
              key={widget.id}
              draggable
              onDragStart={() => handleDragStart(widget.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(widget.id)}
              className="cursor-move"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
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
              </div>
            </div>
          )
        }

        if (widget.type === 'chart') {
          return (
            <div
              key={widget.id}
              draggable
              onDragStart={() => handleDragStart(widget.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(widget.id)}
              className="cursor-move"
            >
              <Card className="p-4 sm:p-5 lg:col-span-2">
                <div className="text-sm sm:text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 sm:mb-4">
                  이번 달 수입/지출
                </div>
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <div className="min-w-[280px] sm:min-w-0">
                    <Monthly data={monthlySeries} />
                  </div>
                </div>
              </Card>
            </div>
          )
        }

        if (widget.type === 'products') {
          return (
            <div
              key={widget.id}
              draggable
              onDragStart={() => handleDragStart(widget.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(widget.id)}
              className="cursor-move"
            >
              <Card className="p-4 sm:p-5">
                <div className="text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
                  판매중인 상품
                </div>
                <div className="space-y-2 max-h-[240px] sm:max-h-[200px] overflow-y-auto overscroll-contain">
                  {activeProducts.length > 0 ? (
                    activeProducts.slice(0, 5).map((p, index) => (
                      <div
                        key={p.id}
                        className={`text-xs sm:text-sm py-2 px-3 rounded-md flex items-center justify-between gap-2 touch-manipulation ${
                          index % 2 === 0 ? 'bg-emerald-50/50' : 'bg-teal-50/50'
                        }`}
                      >
                        <span className="font-medium text-neutral-800 truncate flex-1 min-w-0">
                          {p.name}
                        </span>
                        <span className="text-emerald-700 font-semibold whitespace-nowrap flex-shrink-0">
                          ₩{Number(p.price || 0).toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs sm:text-sm text-neutral-500 py-3">
                      <a className="underline hover:text-emerald-600 touch-manipulation" href="/products">
                        상품 추가
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )
        }

        return null
      })}
    </div>
  )
}

