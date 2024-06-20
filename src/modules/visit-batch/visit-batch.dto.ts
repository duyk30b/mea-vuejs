import { OmitClass } from '../../utils'
import type { ConditionNumber } from '../_base/base-condition'
import type { MovementType } from '../enum'

export class VisitBatchGetQuery {
  page?: number
  limit?: number
  relation?: {
    batch?: boolean
    visitProduct?: boolean
  }

  filter?: {
    visitId?: number
    batchId?: number
    visitProductId?: number | ConditionNumber
  }

  sort?: {
    id?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<VisitBatchGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class VisitBatchPaginationQuery extends VisitBatchGetQuery {}
export class VisitBatchListQuery extends OmitClass(VisitBatchGetQuery, ['page']) {}
