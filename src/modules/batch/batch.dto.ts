import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionNumber } from '../_base/base-condition'

export class BatchGetQuery {
  page?: number
  limit?: number
  relation?: {
    product?: boolean
  }

  filter?: {
    quantity?: ConditionNumber
    expiryDate?: ConditionNumber
    productId?: number | ConditionNumber
    updatedAt?: ConditionDate
    product?: {
      searchText?: string
      group?: string
      quantity?: ConditionNumber
      isActive?: 1 | 0
      updatedAt?: ConditionDate
    }
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    expiryDate?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<BatchGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class BatchPaginationQuery extends BatchGetQuery {}
export class BatchListQuery extends OmitClass(BatchGetQuery, ['page']) {}
export class BatchGetOneQuery extends PickClass(BatchGetQuery, ['relation', 'filter']) {}
export class BatchDetailQuery extends PickClass(BatchGetQuery, ['relation']) {}
