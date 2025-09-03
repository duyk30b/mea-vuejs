import { OmitClass, PickClass } from '../../utils'
import type { ConditionEnum, ConditionNumber } from '../_base/base-condition'
import type { PositionType } from './position.model'

export class PositionGetQuery {
  page?: number
  limit?: number
  relation?: {
    role?: boolean
    productRequest?: boolean
    procedureRequest?: boolean
    procedureResult?: boolean
    laboratoryRequest?: boolean
    laboratoryGroupRequest?: boolean
    laboratoryGroupResult?: boolean
    radiologyRequest?: boolean
    radiologyResult?: boolean
  }

  filter?: {
    roleId?: number
    positionType?: PositionType | ConditionEnum<PositionType>
    positionInteractId?: number | ConditionNumber
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    positionType?: 'ASC' | 'DESC'
    roleId?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<PositionGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class PositionPaginationQuery extends PositionGetQuery { }
export class PositionListQuery extends OmitClass(PositionGetQuery, ['page']) { }
export class PositionDetailQuery extends PickClass(PositionGetQuery, ['relation']) { }
