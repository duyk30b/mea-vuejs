import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionNumber, ConditionString } from '../_base/base-condition'
import type { PickupStrategy } from '../enum'

export class ProductFilterQuery {
  id?: number | ConditionNumber
  isActive?: 1 | 0
  productGroupId?: number
  productCode?: ConditionString
  brandName?: ConditionString
  substance?: ConditionString
  quantity?: ConditionNumber
  updatedAt?: ConditionDate
  pickupStrategy?: PickupStrategy
  warehouseIds?: string | ((value: string) => boolean)
  $OR?: ProductFilterQuery[]
  $AND?: ProductFilterQuery[]
}

export class ProductGetQuery {
  page?: number
  limit?: number
  relation?: {
    batchList?: boolean
    productGroup?: boolean
    commissionList?: boolean
  }

  filter?: ProductFilterQuery

  sort?: {
    id?: 'ASC' | 'DESC'
    productCode?: 'ASC' | 'DESC'
    quantity?: 'ASC' | 'DESC'
    brandName?: 'ASC' | 'DESC'
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
