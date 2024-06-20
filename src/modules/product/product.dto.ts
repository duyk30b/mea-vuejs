import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionNumber } from '../_base/base-condition'

export class ProductGetQuery {
  page?: number
  limit?: number
  relation?: {
    batchList?: boolean
  }

  filter?: {
    id?: number | ConditionNumber
    isActive?: 1 | 0
    group?: string
    searchText?: string
    quantity?: ConditionNumber
    updatedAt?: ConditionDate
    batchList?: {
      quantity?: ConditionNumber
      expiryDate?: ConditionNumber
      updatedAt?: ConditionDate
    }
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    quantity?: 'ASC' | 'DESC'
    brandName?: 'ASC' | 'DESC'
    costAmount?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<ProductGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class ProductPaginationQuery extends ProductGetQuery {}
export class ProductListQuery extends OmitClass(ProductGetQuery, ['page']) {}
export class ProductDetailQuery extends PickClass(ProductGetQuery, ['relation', 'filter']) {}
