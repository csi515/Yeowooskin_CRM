'use client'

import Input from '../../ui/Input'
import Textarea from '../../ui/Textarea'
import CustomerRevenueCard from './CustomerRevenueCard'
import type { Customer } from '@/types/entities'

type CustomerForm = Pick<Customer, 
  'id' | 'name' | 'phone' | 'email' | 'address' |
  'health_allergies' | 'health_medications' | 'health_skin_conditions' |
  'health_pregnant' | 'health_breastfeeding' | 'health_notes' |
  'skin_type' | 'skin_concerns'
>

type CustomerOverviewTabProps = {
  form: CustomerForm | null
  features: string
  initialPoints: number
  fieldErrors?: { name?: string }
  onChangeForm: (updater: (prev: CustomerForm | null) => CustomerForm | null) => void
  onChangeFeatures: (value: string) => void
  onChangeInitialPoints: (value: number) => void
}

export default function CustomerOverviewTab({
  form,
  features,
  initialPoints,
  fieldErrors,
  onChangeForm,
  onChangeFeatures,
  onChangeInitialPoints
}: CustomerOverviewTabProps) {
  if (!form) return null

  return (
    <div className="space-y-4">
      {/* 고객별 매출 요약 카드 */}
      {form?.id && (
        <CustomerRevenueCard customerId={form.id} />
      )}
      
      <div className="bg-white rounded-sm border-2 border-neutral-500 shadow-lg p-4 md:p-5 space-y-3 md:space-y-4">
        <div className="grid grid-cols-1 gap-3 md:gap-4 md:grid-cols-2">
        <div>
          <Input
            label="이름"
            required
            placeholder="예) 홍길동"
            value={form.name}
            onChange={e => onChangeForm(f => f ? ({ ...f, name: e.target.value }) : null)}
            {...(fieldErrors?.name && { error: fieldErrors.name })}
          />
        </div>
        <div>
          <Input
            label="전화번호(선택)"
            placeholder="예) 010-1234-5678"
            value={form.phone || ''}
            onChange={e => onChangeForm(f => f ? ({ ...f, phone: e.target.value }) : null)}
          />
        </div>
        <div>
          <Input
            label="이메일(선택)"
            placeholder="예) user@example.com"
            type="email"
            value={form.email || ''}
            onChange={e => onChangeForm(f => f ? ({ ...f, email: e.target.value }) : null)}
          />
        </div>
        <div>
          <Input
            label="주소(선택)"
            placeholder="예) 서울시 ○○구 ○○로 12"
            value={form.address || ''}
            onChange={e => onChangeForm(f => f ? ({ ...f, address: e.target.value }) : null)}
          />
        </div>
        <div className="md:col-span-2">
          <Textarea
            label="특징(선택)"
            placeholder="고객 성향, 선호도, 주의사항 등을 기록하세요"
            value={features}
            onChange={e => onChangeFeatures(e.target.value)}
          />
        </div>
        {!form.id && (
          <div>
            <Input
              label="초기 포인트(선택)"
              type="number"
              value={initialPoints === null || initialPoints === undefined || initialPoints === 0 ? '' : initialPoints}
              onChange={e => {
                const val = e.target.value
                onChangeInitialPoints(val === '' ? 0 : (isNaN(Number(val)) ? 0 : Number(val)))
              }}
              placeholder="예: 1,000"
            />
            <p className="mt-1 text-xs text-neutral-500">
              새 고객 저장 후 초기 포인트로 반영됩니다.
            </p>
          </div>
        )}
        </div>

        {/* 건강 정보 섹션 */}
        <div className="mt-6 pt-6 border-t border-neutral-300">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">건강 정보</h3>
          <div className="grid grid-cols-1 gap-3 md:gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Textarea
                label="알레르기/주의사항"
                placeholder="알레르기 반응이 있는 성분이나 주의사항을 기록하세요"
                value={form.health_allergies || ''}
                onChange={e => onChangeForm(f => f ? ({ ...f, health_allergies: e.target.value }) : null)}
              />
            </div>
            <div className="md:col-span-2">
              <Textarea
                label="복용 중인 약물"
                placeholder="현재 복용 중인 약물을 기록하세요"
                value={form.health_medications || ''}
                onChange={e => onChangeForm(f => f ? ({ ...f, health_medications: e.target.value }) : null)}
              />
            </div>
            <div className="md:col-span-2">
              <Textarea
                label="피부 질환 이력"
                placeholder="과거 또는 현재 피부 질환 이력을 기록하세요"
                value={form.health_skin_conditions || ''}
                onChange={e => onChangeForm(f => f ? ({ ...f, health_skin_conditions: e.target.value }) : null)}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.health_pregnant || false}
                  onChange={e => onChangeForm(f => f ? ({ ...f, health_pregnant: e.target.checked }) : null)}
                  className="w-4 h-4 rounded border-neutral-300 text-pink-600"
                />
                <span className="text-sm text-neutral-700">임신 중</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.health_breastfeeding || false}
                  onChange={e => onChangeForm(f => f ? ({ ...f, health_breastfeeding: e.target.checked }) : null)}
                  className="w-4 h-4 rounded border-neutral-300 text-pink-600"
                />
                <span className="text-sm text-neutral-700">수유 중</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <Textarea
                label="건강 관련 메모"
                placeholder="기타 건강 관련 메모"
                value={form.health_notes || ''}
                onChange={e => onChangeForm(f => f ? ({ ...f, health_notes: e.target.value }) : null)}
              />
            </div>
          </div>
        </div>

        {/* 피부 정보 섹션 */}
        <div className="mt-6 pt-6 border-t border-neutral-300">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">피부 정보</h3>
          <div className="grid grid-cols-1 gap-3 md:gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">피부 타입</label>
              <select
                value={form.skin_type || ''}
                onChange={e => onChangeForm(f => f ? ({ ...f, skin_type: e.target.value || null }) : null)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">선택 안함</option>
                <option value="민감성">민감성</option>
                <option value="건조">건조</option>
                <option value="지성">지성</option>
                <option value="복합성">복합성</option>
                <option value="중성">중성</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">피부 고민</label>
              <div className="flex flex-wrap gap-2">
                {['여드름', '기미', '주름', '모공', '색소침착', '홍조', '아토피'].map((concern) => {
                  const concerns = form.skin_concerns || []
                  const isSelected = concerns.includes(concern)
                  return (
                    <button
                      key={concern}
                      type="button"
                      onClick={() => {
                        const newConcerns = isSelected
                          ? concerns.filter((c: string) => c !== concern)
                          : [...concerns, concern]
                        onChangeForm(f => f ? ({ ...f, skin_concerns: newConcerns }) : null)
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-pink-100 text-pink-800 border border-pink-300'
                          : 'bg-neutral-100 text-neutral-700 border border-neutral-300 hover:bg-neutral-200'
                      }`}
                    >
                      {concern}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

