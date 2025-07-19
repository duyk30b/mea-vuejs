import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionNumber } from '../_base/base-condition'

export class OrganizationGetQuery {
  page?: number
  limit?: number
  relation?: {
    userList?: boolean
  }

  filter?: {
    id?: number
  }

  sort?: {
    id?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<OrganizationGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class OrganizationPaginationQuery extends OrganizationGetQuery { }
export class OrganizationListQuery extends OmitClass(OrganizationGetQuery, ['page']) { }
export class OrganizationDetailQuery extends PickClass(OrganizationGetQuery, ['relation']) { }
