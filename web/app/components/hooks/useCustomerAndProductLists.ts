'use client'

import { useEffect, useState } from 'react'
import { customersApi } from '@/app/lib/api/customers'
import { productsApi } from '@/app/lib/api/products'
import type { Customer } from '@/types/entities'
import type { Product } from '@/types/entities'

export function useCustomerAndProductLists(open: boolean) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    if (!open) return

    const loadLists = async () => {
      try {
        const [customersData, productsData] = await Promise.all([
          customersApi.list({ limit: 1000 }),
          productsApi.list({ limit: 1000 }),
        ])

        setCustomers(Array.isArray(customersData) ? customersData : [])
        setProducts(Array.isArray(productsData) ? productsData : [])
      } catch {
        setCustomers([])
        setProducts([])
      }
    }

    loadLists()
  }, [open])

  return { customers, products }
}


