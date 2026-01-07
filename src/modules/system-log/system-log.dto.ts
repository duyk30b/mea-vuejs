import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionNumber, ConditionString } from '../_base/base-condition'

export class SystemLogGetFilter {
  oid?: number
  uid?: number
  clientId?: string
  apiMethod?: string
  prefixController?: string
  url?: string | ConditionString
  errorMessage?: string | ConditionString
  $OR?: SystemLogGetFilter[]
  $AND?: SystemLogGetFilter[]
}

export class SystemLogGetQuery {
  page?: number
  limit?: number
  relation?: {}
  filter?: SystemLogGetFilter
  sort?: {
    id?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<SystemLogGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class SystemLogPaginationQuery extends SystemLogGetQuery { }
export class SystemLogListQuery extends OmitClass(SystemLogGetQuery, ['page']) { }
export class SystemLogDetailQuery extends PickClass(SystemLogGetQuery, ['relation']) { }
