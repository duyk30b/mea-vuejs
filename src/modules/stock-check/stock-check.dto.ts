import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionEnum } from '../_base/base-condition'
import type { StockCheckStatus } from './stock-check.model'

export class StockCheckGetQuery {
  page?: number
  limit?: number
  relation?: {
    createdByUser?: boolean
    updatedByUser?: boolean
    stockCheckItemList?: { product?: boolean; batch?: boolean } | false
  }

  filter?: {
    createdByUserId?: number
    updatedByUserId?: number
    createdAt?: ConditionDate
    status?: StockCheckStatus | ConditionEnum<StockCheckStatus>
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    createdAt?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<StockCheckGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class StockCheckPaginationQuery extends StockCheckGetQuery {}
export class StockCheckListQuery extends OmitClass(StockCheckGetQuery, ['page']) {}
export class StockCheckDetailQuery extends PickClass(StockCheckGetQuery, ['relation']) {}
