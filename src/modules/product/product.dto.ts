import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionNumber, ConditionString } from '../_base/base-condition'

export class ProductFilterQuery {
  id?: number | ConditionNumber
  isActive?: 1 | 0
  productGroupId?: number
  brandName?: ConditionString
  substance?: ConditionString
  quantity?: ConditionNumber
  updatedAt?: ConditionDate
  warehouseIds?: string | ((value: string) => boolean)
}

export class ProductGetQuery {
  page?: number
  limit?: number
  relation?: {
    batchList?: boolean
    productGroup?: boolean
    commissionList?: boolean
  }

  filter?: ProductFilterQuery & {
    batchList?: {
      quantity?: ConditionNumber
      warehouseId?: ConditionNumber
      updatedAt?: ConditionDate
    }
    $OR?: [{ brandName: { LIKE: string } }, { substance: { LIKE: string } }]
  }

  sort?: {
    id?: 'ASC' | 'DESC'
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
