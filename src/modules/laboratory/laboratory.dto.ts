import { OmitClass, PickClass } from '../../utils'
import type { ConditionNumber, ConditionString } from '../_base/base-condition'

export class LaboratoryGetQuery {
  page?: number
  limit?: number
  relation?: {
    laboratoryGroup?: boolean
    children?: boolean
  }

  filter?: {
    name?: ConditionString
    laboratoryGroupId?: number
    level?: number
    parentId?: number
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    name?: 'ASC' | 'DESC'
    priority?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<LaboratoryGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class LaboratoryPaginationQuery extends LaboratoryGetQuery {}
export class LaboratoryListQuery extends OmitClass(LaboratoryGetQuery, ['page']) {}
export class LaboratoryDetailQuery extends PickClass(LaboratoryGetQuery, ['relation']) {}
