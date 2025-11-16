export default function StatProgress({
  label,
  value,
  max = 100,
  color = 'blue',
  className = '',
}: {
  label: string
  value: number
  max?: number
  color?: 'blue' | 'emerald' | 'amber' | 'rose'
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, Math.round((value / (max || 1)) * 100)))
  const barColor =
    color === 'emerald' ? 'bg-emerald-600' : color === 'amber' ? 'bg-amber-500' : color === 'rose' ? 'bg-rose-600' : 'bg-blue-600'
  return (
    <div className={`bg-white rounded-[16px] border border-neutral-200 shadow-md p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-neutral-600">{label}</div>
        <div className="text-sm font-medium text-neutral-900">{pct}%</div>
      </div>
      <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}


