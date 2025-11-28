/**
 * 상품 Repository
 */

import { BaseRepository } from './base.repository'
import type { Product, ProductCreateInput, ProductUpdateInput } from '@/types/entities'

export class ProductsRepository extends BaseRepository<Product> {
  constructor(userId: string) {
    super(userId, 'products')
  }

  /**
   * 상품 생성
   */
  async createProduct(input: ProductCreateInput): Promise<Product> {
    const name = String(input.name || '').trim()
    const price = Number(input.price || 0)

    if (!name) {
      throw new Error('name required')
    }
    if (Number.isNaN(price) || price < 0) {
      throw new Error('invalid price')
    }

    const payload: Record<string, unknown> = {
      name,
      price,
      active: input.active !== false,
    }

    // description은 값이 있을 때만 포함 (스키마에 없을 수 있음)
    const descriptionValue = input.description
    if (descriptionValue !== undefined && descriptionValue !== null && descriptionValue !== '' && String(descriptionValue).trim() !== '') {
      payload['description'] = String(descriptionValue).trim()
    }
    if (payload['description'] === undefined || payload['description'] === null || payload['description'] === '' || String(payload['description']).trim() === '') {
      delete payload['description']
    }

    return this.create(payload as unknown as Product)
  }

  /**
   * 상품 업데이트
   */
  async updateProduct(id: string, input: ProductUpdateInput): Promise<Product> {
    const payload: Partial<Product> = {}

    if (input.name !== undefined) {
      const name = String(input.name).trim()
      if (!name) {
        throw new Error('name cannot be empty')
      }
      payload.name = name
    }

    if (input.price !== undefined) {
      const price = Number(input.price)
      if (Number.isNaN(price) || price < 0) {
        throw new Error('invalid price')
      }
      payload.price = price
    }

    // description은 값이 있을 때만 업데이트 (스키마에 없을 수 있음)
    const descriptionValue = input.description
    if (descriptionValue !== undefined && descriptionValue !== null && descriptionValue !== '' && String(descriptionValue).trim() !== '') {
      payload['description'] = String(descriptionValue).trim()
    }
    if (payload['description'] === undefined || payload['description'] === null || payload['description'] === '' || String(payload['description']).trim() === '') {
      delete payload['description']
    }
    if (input.active !== undefined) payload.active = input.active

    return this.update(id, payload)
  }
}

