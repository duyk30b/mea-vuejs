import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionString } from '../_base/base-condition'

export class RegimenGetQuery {
  page?: number
  limit?: number
  relation?: {
    regimenItemList?: { procedure?: boolean }
    positionList?: boolean
    discountList?: boolean
  }

  filter?: {
    name?: ConditionString
    isActive?: 1 | 0
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    code?: 'ASC' | 'DESC'
    name?: 'ASC' | 'DESC'
    price?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<RegimenGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class RegimenPaginationQuery extends RegimenGetQuery { }
export class RegimenListQuery extends OmitClass(RegimenGetQuery, ['page']) { }
export class RegimenDetailQuery extends PickClass(RegimenGetQuery, ['relation']) { }
