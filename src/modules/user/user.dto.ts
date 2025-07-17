import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionNumber, ConditionString } from '../_base/base-condition'

export class UserGetQuery {
  page?: number
  limit?: number
  relation?: {
    organization?: boolean
    userRoleList?: { role?: boolean }
    userRoomList?: { room?: boolean }
  }

  filter?: {
    roleId?: number | ConditionNumber
    searchText?: string
    isAdmin?: 1 | 0
    isActive?: 1 | 0
    updatedAt?: ConditionDate
    fullName?: ConditionString
  }

  sort?: {
    id?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<UserGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class UserPaginationQuery extends UserGetQuery { }
export class UserListQuery extends OmitClass(UserGetQuery, ['page']) { }
export class UserDetailQuery extends PickClass(UserGetQuery, ['relation']) { }
