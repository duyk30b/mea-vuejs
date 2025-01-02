import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate } from '../_base/base-condition'

export class RoleGetQuery {
  page?: number
  limit?: number
  relation?: {
    userRoleList?: { user?: boolean } | false
  }

  filter?: {
    isActive?: 1 | 0
    updatedAt?: ConditionDate
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    code?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<RoleGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class RolePaginationQuery extends RoleGetQuery {}
export class RoleListQuery extends OmitClass(RoleGetQuery, ['page']) {}
export class RoleDetailQuery extends PickClass(RoleGetQuery, ['relation']) {}
