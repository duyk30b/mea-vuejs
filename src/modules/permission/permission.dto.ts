import { OmitClass, PickClass } from '../../utils'
import type { ConditionNumber } from '../_base/base-condition'

export class PermissionGetQuery {
  page?: number
  limit?: number
  relation?: {}

  filter?: {
    level?: ConditionNumber
    rootId?: ConditionNumber
  }

  sort?: {
    id?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<PermissionGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class PermissionPaginationQuery extends PermissionGetQuery {}
export class PermissionListQuery extends OmitClass(PermissionGetQuery, ['page']) {}
export class PermissionDetailQuery extends PickClass(PermissionGetQuery, ['relation']) {}
