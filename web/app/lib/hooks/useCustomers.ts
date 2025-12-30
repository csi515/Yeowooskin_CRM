import { useState, useEffect, useCallback } from 'react'
import { useAppToast } from '../ui/toast'
import { type Customer } from '@/types/entities'
import { type CustomerPageState } from '@/types/customer'

export function useCustomers(searchQuery: string) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [state, setState] = useState<CustomerPageState>({
    loading: false,
    error: '',
    selectedCustomerIds: [],
    pointsByCustomer: {}
  })

  const toast = useAppToast()

  const loadCustomers = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: '' }))
      const { customersApi } = await import('@/app/lib/api/customers')
      const data = await customersApi.list(searchQuery ? { search: searchQuery } : {})
      setCustomers(Array.isArray(data) ? data : [])
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '에러가 발생했습니다.'
      setState(prev => ({ ...prev, error: errorMessage }))
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [searchQuery])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  // 포인트 조회 최적화 - 전체 고객 데이터에 대해 한 번에 조회
  useEffect(() => {
    const fetchPoints = async () => {
      if (!customers.length) return

      try {
        const { pointsApi } = await import('@/app/lib/api/points')

        // 아직 조회하지 않은 고객만 조회
        const customersToFetch = customers.filter(c => !(c.id in state.pointsByCustomer))

        if (customersToFetch.length === 0) return

        // 최대 5개씩 동시에 조회하여 API 부하 감소
        const batchSize = 5
        const batches = []
        for (let i = 0; i < customersToFetch.length; i += batchSize) {
          batches.push(customersToFetch.slice(i, i + batchSize))
        }

        for (const batch of batches) {
          const promises = batch.map(async (c) => {
            try {
              const data = await pointsApi.getBalance(c.id, { withLedger: false })
              const balance = Number(data?.balance || 0)
              return [c.id, balance] as [string, number]
            } catch {
              return [c.id, 0] as [string, number]
            }
          })

          const results = await Promise.all(promises)
          setState(prev => ({
            ...prev,
            pointsByCustomer: { ...prev.pointsByCustomer, ...Object.fromEntries(results) }
          }))

          // 배치 간 약간의 지연으로 API 부하 감소
          if (batches.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }
      } catch (error) {
        console.error('포인트 조회 중 오류:', error)
      }
    }

    fetchPoints()
  }, [customers, state.pointsByCustomer])

  const updateSelectedCustomerIds = (ids: string[]) => {
    setState(prev => ({ ...prev, selectedCustomerIds: ids }))
  }

  return {
    customers,
    ...state,
    refreshCustomers: loadCustomers,
    updateSelectedCustomerIds,
  }
}
