type Props = { tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'; children: React.ReactNode; className?: string }

export default function Badge({ tone = 'neutral', children, className = '' }: Props) {
  const tones: Record<string, string> = {
    primary: 'bg-secondary-50 text-secondary-700 border border-secondary-200',
    success: 'bg-success-50 text-success-700 border border-success-200',
    warning: 'bg-warning-50 text-warning-700 border border-warning-200',
    danger: 'bg-error-50 text-error-700 border border-error-200',
    neutral: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
  }
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs whitespace-nowrap ${tones[tone]} ${className}`}>{children}</span>}
