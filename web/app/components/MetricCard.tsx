export default function MetricCard({
  label,
  value,
  delta,
  hint,
  className = '',
}: {
  label: string
  value: string | number
  delta?: { value: string; tone?: 'up' | 'down' | 'neutral' }
  hint?: string
  className?: string
}) {
  const toneCls =
    delta?.tone === 'up'
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
      : delta?.tone === 'down'
      ? 'text-rose-600 bg-rose-50 border-rose-200'
      : 'text-neutral-600 bg-neutral-50 border-neutral-200'
  return (
    <div className={`bg-white rounded-lg border border-gray-100 shadow-sm p-4 md:p-6 ${className}`}>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-2 flex items-baseline gap-3">
        <div className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">{value}</div>
        {delta?.value && (
          <span className={`text-xs inline-flex items-center rounded-full px-2 py-0.5 border ${toneCls}`}>{delta.value}</span>
        )}
      </div>
      {hint && <div className="mt-2 text-xs text-gray-500">{hint}</div>}
    </div>
  )
}


