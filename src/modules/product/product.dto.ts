import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionNumber } from '../_base/base-condition'

export class ProductFilterQuery {
  id?: number | ConditionNumber
  isActive?: 1 | 0
  productGroupId?: number
  searchText?: string
  quantity?: ConditionNumber
  updatedAt?: ConditionDate
  expiryDate?: ConditionNumber
}

export class ProductGetQuery {
  page?: number
  limit?: number
  relation?: {
    batchList?: boolean
    productGroup?: boolean
  }

  filter?: ProductFilterQuery & {
    batchList?: {
      quantity?: ConditionNumber
      expiryDate?: ConditionNumber
      updatedAt?: ConditionDate
    }
    $OR?: ProductFilterQuery[]
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    quantity?: 'ASC' | 'DESC'
    brandName?: 'ASC' | 'DESC'
    costAmount?: 'ASC' | 'DESC'
    expiryDate?: 'ASC' | 'DESC'
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
