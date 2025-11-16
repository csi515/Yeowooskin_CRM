/**
 * 헬스체크 및 개발 관련 API 메서드
 */

export interface EndpointStatus {
  customers: number
  products: number
  expenses: number
}

export const healthApi = {
  /**
   * 엔드포인트 상태 확인
   */
  async checkEndpoints(): Promise<EndpointStatus> {
    const [customers, products, expenses] = await Promise.all([
      fetch('/api/customers?limit=1', { cache: 'no-store' }),
      fetch('/api/products?limit=1', { cache: 'no-store' }),
      fetch('/api/expenses?limit=1', { cache: 'no-store' }),
    ])

    return {
      customers: customers.status,
      products: products.status,
      expenses: expenses.status,
    }
  },
}

