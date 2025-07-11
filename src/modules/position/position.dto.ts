import { OmitClass, PickClass } from '../../utils'
import type { ConditionEnum } from '../_base/base-condition'
import type { PositionInteractType } from './position.model'

export class PositionGetQuery {
  page?: number
  limit?: number
  relation?: {
    role?: boolean
    product?: boolean
    procedure?: boolean
    radiology?: boolean
    laboratory?: boolean
  }

  filter?: {
    roleId?: number
    positionType?: PositionInteractType | ConditionEnum<PositionInteractType>
    positionInteractId?: number
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

export class PositionPaginationQuery extends PositionGetQuery {}
export class PositionListQuery extends OmitClass(PositionGetQuery, ['page']) {}
export class PositionDetailQuery extends PickClass(PositionGetQuery, ['relation']) {}
