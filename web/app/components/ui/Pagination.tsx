'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from './Button'
import clsx from 'clsx'

type Props = {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
  className?: string
}

export default function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className
}: Props) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className={clsx(
      'flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-neutral-50 border-t border-neutral-200',
      className
    )}>
      {/* 정보 표시 */}
      <div className="text-xs sm:text-sm text-neutral-600 order-2 sm:order-1">
        총 {totalItems.toLocaleString()}개 · {startItem.toLocaleString()}-{endItem.toLocaleString()}개 표시
      </div>

      {/* 페이지네이션 컨트롤 */}
      <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto">
        {/* 페이지 크기 선택 */}
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value))
            onPageChange(1)
          }}
          className="h-10 sm:h-9 rounded-lg border border-neutral-300 px-3 text-sm bg-white focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-all touch-manipulation"
          aria-label="페이지당 항목 수"
        >
          {pageSizeOptions.map(size => (
            <option key={size} value={size}>
              {size}개/페이지
            </option>
          ))}
        </select>

        {/* 이전/다음 버튼 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="h-10 w-10 sm:h-9 sm:w-9 inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 hover:border-neutral-400 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-secondary-400 transition-all touch-manipulation"
            aria-label="이전 페이지"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          {/* 페이지 번호 */}
          <div className="hidden sm:flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={clsx(
                    'h-9 w-9 rounded-lg border text-sm font-medium transition-all touch-manipulation',
                    currentPage === pageNum
                      ? 'bg-secondary-600 text-white border-secondary-600'
                      : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400'
                  )}
                  aria-label={`${pageNum}페이지`}
                  aria-current={currentPage === pageNum ? 'page' : undefined}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          <span className="sm:hidden text-sm text-neutral-600 font-medium px-2">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="h-10 w-10 sm:h-9 sm:w-9 inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 hover:border-neutral-400 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-secondary-400 transition-all touch-manipulation"
            aria-label="다음 페이지"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
