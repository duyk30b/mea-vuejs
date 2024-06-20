import { OmitClass } from '../../utils'
import type { ConditionNumber } from '../_base/base-condition'
import type { VoucherType } from '../enum'

export class BatchMovementGetQuery {
  page?: number
  limit?: number
  relation?: {
    batch?: boolean
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
    voucherType?: VoucherType
    voucherId?: number | ConditionNumber
    contactId?: number | ConditionNumber
  }

  sort?: {
    id?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<BatchMovementGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class BatchMovementPaginationQuery extends BatchMovementGetQuery {}
export class BatchMovementListQuery extends OmitClass(BatchMovementGetQuery, ['page']) {}
