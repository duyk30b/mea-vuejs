import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionNumber, ConditionString } from '../_base/base-condition'

export class BatchFilterQuery {
  id?: number | ConditionNumber
  lotNumber?: string | ConditionString
  warehouseId?: number | ConditionNumber
  productId?: number | ConditionNumber
  distributorId?: number | ConditionNumber
  expiryDate?: ConditionNumber
  quantity?: ConditionNumber
  updatedAt?: ConditionDate | ConditionNumber
  registeredAt?: ConditionDate | ConditionNumber
  isActive?: number
}

export class BatchGetQuery {
  page?: number
  limit?: number
  relation?: {
    product?: boolean
  }

  filter?: BatchFilterQuery & { $OR?: BatchFilterQuery[] }

  sort?: {
    id?: 'ASC' | 'DESC'
    lotNumber?: 'ASC' | 'DESC'
    quantity?: 'ASC' | 'DESC'
    productId?: 'ASC' | 'DESC'
    expiryDate?: 'ASC' | 'DESC'
    registeredAt?: 'ASC' | 'DESC'
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
