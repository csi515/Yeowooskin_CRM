'use client'

type CustomerSummaryBarProps = {
  name: string
  phone?: string
  email?: string
  pointsBalance: number
  holdingsCount: number
}

export default function CustomerSummaryBar({
  name,
  phone,
  email,
  pointsBalance,
  holdingsCount
}: CustomerSummaryBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm border-2 border-neutral-500 bg-white px-5 py-4 shadow-lg">
      <div className="min-w-0">
        <div className="truncate text-base font-semibold text-neutral-900">{name}</div>
        <div className="mt-1 text-sm text-neutral-600">
          {phone || '-'}{email ? ` · ${email}` : ''}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <div className="text-center">
          <div className="text-xs text-neutral-600 mb-1">포인트</div>
          <div className="text-lg font-bold text-[#1D4ED8]">
            {pointsBalance.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-neutral-600 mb-1">보유 상품</div>
          <div className="text-lg font-bold text-neutral-900">{holdingsCount}개</div>
        </div>
      </div>
    </div>
  )
}

