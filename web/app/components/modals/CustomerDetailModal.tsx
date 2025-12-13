'use client'

import { useState } from 'react'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../ui/Modal'
import Button from '../ui/Button'
import Tabs, { TabsContent, TabsList, TabsTrigger } from '../ui/Tabs'
import CustomerSummaryBar from './customer-detail/CustomerSummaryBar'
import CustomerOverviewTab from './customer-detail/CustomerOverviewTab'
import CustomerTransactionsTab from './customer-detail/CustomerTransactionsTab'
import type { Customer } from '@/types/entities'
import { useCustomerDetail } from './customer-detail/useCustomerDetail'

export default function CustomerDetailModal({
  open,
  onClose,
  item,
  onSaved,
  onDeleted
}: {
  open: boolean
  onClose: () => void
  item: Customer | null
  onSaved: () => void
  onDeleted: () => void
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview')

  const {
    form, setForm,
    loading,
    error,
    features, setFeatures,
    fieldErrors,
    pointsBalance,
    pointsDelta, setPointsDelta,
    pointsReason, setPointsReason,
    pointsLedger,
    holdings,
    products,
    newProductId, setNewProductId,
    newQty, setNewQty,
    newReason, setNewReason,
    addingProduct,
    holdingDelta, setHoldingDelta,
    holdingReason, setHoldingReason,
    productLedger,
    createAndClose,
    handleAddPoints,
    handleDeductPoints,
    handleAddProduct,
    handleIncreaseHolding,
    handleDecreaseHolding,
    handleDeleteHolding,
    removeItem
  } = useCustomerDetail(item, open, onSaved, onDeleted, onClose)

  if (!open || !form) return null

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader title="고객 상세" />
      <ModalBody>
        <div className="space-y-6">
          {error && <p className="text-sm text-rose-600">{error}</p>}

          {/* 상단 요약 바 - 기존 고객만 */}
          {form?.id && (
            <CustomerSummaryBar
              name={form.name}
              phone={form.phone ?? null}
              email={form.email ?? null}
              pointsBalance={pointsBalance}
              holdingsCount={holdings.length}
            />
          )}

          {!form?.id ? (
            // 신규 고객: 탭 없이 기본정보만 표시
            <div className="mt-6">
              <CustomerOverviewTab
                form={form ? {
                  id: form.id,
                  name: form.name,
                  phone: form.phone ?? null,
                  email: form.email ?? null,
                  address: form.address ?? null,
                } : null}
                features={features}
                fieldErrors={fieldErrors}
                onChangeForm={(updater) => {
                  setForm(f => {
                    const result = updater(f ? {
                      id: f.id,
                      name: f.name,
                      phone: f.phone ?? null,
                      email: f.email ?? null,
                      address: f.address ?? null,
                    } : null)
                    if (!result) return null
                    return {
                      ...f!,
                      name: result.name || '',
                      phone: result.phone ?? null,
                      email: result.email ?? null,
                      address: result.address ?? null,
                    } as Customer
                  })
                }}
                onChangeFeatures={setFeatures}

                onDelete={removeItem}
                isNewCustomer={!form?.id}
              />
            </div>
          ) : (
            // 기존 고객: 탭 표시
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'overview' | 'transactions')} className="mt-6">
              <TabsList className="mb-6 border-b-2 border-neutral-400">
                <TabsTrigger value="overview">
                  기본 정보
                </TabsTrigger>
                <TabsTrigger value="transactions">
                  포인트 & 보유상품
                </TabsTrigger>
              </TabsList>

              {/* 기본 정보 탭 */}
              <TabsContent value="overview">
                <CustomerOverviewTab
                  form={form ? {
                    id: form.id,
                    name: form.name,
                    phone: form.phone ?? null,
                    email: form.email ?? null,
                    address: form.address ?? null,
                  } : null}
                  features={features}

                  fieldErrors={fieldErrors}
                  onChangeForm={(updater) => {
                    setForm(f => {
                      const result = updater(f ? {
                        id: f.id,
                        name: f.name,
                        phone: f.phone ?? null,
                        email: f.email ?? null,
                        address: f.address ?? null,
                      } : null)
                      if (!result) return null
                      return {
                        ...f!,
                        name: result.name || '',
                        phone: result.phone ?? null,
                        email: result.email ?? null,
                        address: result.address ?? null,
                      } as Customer
                    })
                  }}
                  onChangeFeatures={setFeatures}

                  onDelete={removeItem}
                  isNewCustomer={!form?.id}
                />
              </TabsContent>

              {/* 통합 거래 탭 (포인트 + 보유상품) */}
              <TabsContent value="transactions">
                <CustomerTransactionsTab
                  customerId={form?.id || ''}
                  pointsBalance={pointsBalance}
                  pointsDelta={pointsDelta}
                  pointsReason={pointsReason}
                  pointsLedger={pointsLedger}
                  onChangePointsDelta={setPointsDelta}
                  onChangePointsReason={setPointsReason}
                  onAddPoints={handleAddPoints}
                  onDeductPoints={handleDeductPoints}
                  holdings={holdings}
                  products={products}
                  newProductId={newProductId}
                  newQty={newQty}
                  newReason={newReason}
                  holdingDelta={holdingDelta}
                  holdingReason={holdingReason}
                  addingProduct={addingProduct}
                  productLedger={productLedger}
                  onChangeNewProduct={setNewProductId}
                  onChangeNewQty={setNewQty}
                  onChangeNewReason={setNewReason}
                  onChangeHoldingDelta={(id: string, v: number) => setHoldingDelta(s => ({ ...s, [id]: v }))}
                  onChangeHoldingReason={(id: string, v: string) => setHoldingReason(s => ({ ...s, [id]: v }))}
                  onAddProduct={handleAddProduct}
                  onIncrease={(holding) => handleIncreaseHolding(holding)}
                  onDecrease={(holding) => handleDecreaseHolding(holding)}
                  onDelete={(id: string) => handleDeleteHolding(id)}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </ModalBody>
      {!form?.id && (
        <ModalFooter>
          <div className="flex justify-end w-full">
            <Button
              variant="primary"
              onClick={createAndClose}
              loading={loading}
              disabled={loading}
              className="min-h-[44px]"
            >
              고객 생성
            </Button>
          </div>
        </ModalFooter>
      )}
    </Modal>
  )
}
