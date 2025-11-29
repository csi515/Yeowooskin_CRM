'use client'

import { useState, memo } from 'react'
import { DollarSign, Plus, Trash2, CreditCard } from 'lucide-react'
import CollapsibleSection from '../ui/CollapsibleSection'
import Input from '../ui/Input'
import Button from '../ui/Button'
import InfoTooltip from '../ui/InfoTooltip'
import { type FinancialSettings } from '@/types/settings'

type Props = {
  data: FinancialSettings
  onChange: (data: Partial<FinancialSettings>) => void
}

function FinancialSettingsSection({ data, onChange }: Props) {
  const [newCategory, setNewCategory] = useState('')
  const [newIncomeCategory, setNewIncomeCategory] = useState('')

  const addCategory = () => {
    if (newCategory.trim() && !data.expenseCategories.includes(newCategory.trim())) {
      onChange({
        expenseCategories: [...data.expenseCategories, newCategory.trim()],
      })
      setNewCategory('')
    }
  }

  const removeCategory = (category: string) => {
    onChange({
      expenseCategories: data.expenseCategories.filter((c) => c !== category),
    })
  }

  const addIncomeCategory = () => {
    if (newIncomeCategory.trim() && !data.incomeCategories.includes(newIncomeCategory.trim())) {
      onChange({
        incomeCategories: [...data.incomeCategories, newIncomeCategory.trim()],
      })
      setNewIncomeCategory('')
    }
  }

  const removeIncomeCategory = (category: string) => {
    onChange({
      incomeCategories: data.incomeCategories.filter((c) => c !== category),
    })
  }

  return (
    <CollapsibleSection
      title="재무 및 정산 설정"
      description="수입 및 비용 항목을 관리합니다."
      icon={<DollarSign className="w-6 h-6" />}
      iconColor="from-green-500 to-green-600"
    >
      <div className="space-y-6">
        {/* 수입 항목 관리 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-neutral-700" />
            <h3 className="text-lg font-semibold text-neutral-800">수입 항목 관리</h3>
            <InfoTooltip content="자주 발생하는 수입 항목을 등록하여 빠르게 선택할 수 있습니다." />
          </div>

          <div className="flex gap-2">
            <Input
              value={newIncomeCategory}
              onChange={(e) => setNewIncomeCategory(e.target.value)}
              placeholder="새 수입 항목 입력"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addIncomeCategory()
                }
              }}
            />
            <Button
              variant="outline"
              onClick={addIncomeCategory}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              추가
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {data.incomeCategories.map((category) => (
              <div
                key={category}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700"
              >
                <span className="text-sm font-medium">{category}</span>
                <button
                  type="button"
                  onClick={() => removeIncomeCategory(category)}
                  className="p-0.5 rounded hover:bg-blue-100 text-blue-600 hover:text-rose-600 transition-colors"
                  aria-label={`${category} 삭제`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-neutral-200" />

        {/* 비용 항목 관리 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-neutral-700" />
            <h3 className="text-lg font-semibold text-neutral-800">비용 항목 관리</h3>
            <InfoTooltip content="자주 사용하는 비용 항목을 등록하여 빠르게 선택할 수 있습니다." />
          </div>

          <div className="flex gap-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="새 항목 입력"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCategory()
                }
              }}
            />
            <Button
              variant="outline"
              onClick={addCategory}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              추가
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {data.expenseCategories.map((category) => (
              <div
                key={category}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700"
              >
                <span className="text-sm font-medium">{category}</span>
                <button
                  type="button"
                  onClick={() => removeCategory(category)}
                  className="p-0.5 rounded hover:bg-green-100 text-green-600 hover:text-rose-600 transition-colors"
                  aria-label={`${category} 삭제`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}

// React.memo로 래핑하여 props가 변경되지 않으면 리렌더링 방지
export default memo(FinancialSettingsSection)
