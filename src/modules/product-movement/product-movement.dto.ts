import { OmitClass } from '../../utils'
import type { ConditionEnum, ConditionNumber } from '../_base/base-condition'
import type { VoucherType } from '../enum'

export class ProductMovementGetQuery {
  page?: number
  limit?: number
  relation?: {
    product?: boolean
    receipt?: boolean
    invoice?: boolean
    visit?: boolean
    distributor?: boolean
    customer?: boolean
  }

  filter?: {
    productId?: number
    batchId?: number
    voucherType?: VoucherType | ConditionEnum<VoucherType>
    voucherId?: number | ConditionNumber
    contactId?: number | ConditionNumber
  }

  sort?: {
    id?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<ProductMovementGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class ProductMovementPaginationQuery extends ProductMovementGetQuery {}
export class ProductMovementListQuery extends OmitClass(ProductMovementGetQuery, ['page']) {}
