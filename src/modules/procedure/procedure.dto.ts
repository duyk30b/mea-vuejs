import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionString } from '../_base/base-condition'

export class ProcedureGetQuery {
  page?: number
  limit?: number
  relation?: {
    procedureGroup?: boolean
    positionList?: boolean
    discountList?: boolean
  }

  filter?: {
    name?: ConditionString
    isActive?: 1 | 0
    procedureGroupId?: number
    updatedAt?: ConditionDate
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    procedureCode?: 'ASC' | 'DESC'
    name?: 'ASC' | 'DESC'
    price?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<ProcedureGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class ProcedurePaginationQuery extends ProcedureGetQuery {}
export class ProcedureListQuery extends OmitClass(ProcedureGetQuery, ['page']) {}
export class ProcedureDetailQuery extends PickClass(ProcedureGetQuery, ['relation']) {}
