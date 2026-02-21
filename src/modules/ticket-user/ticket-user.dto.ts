import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionNumber } from '../_base/base-condition'

export class TicketUserGetQuery {
  page?: number
  limit?: number
  relation?: {
    ticket?: boolean
    user?: boolean
    role?: boolean
    position?: boolean
    product?: boolean
    procedure?: boolean
    regimen?: boolean
    laboratory?: boolean
    laboratoryGroup?: boolean
    radiology?: boolean
  }

  filter?: {
    ticketId?: string
    roleId?: number
    userId?: number
    positionId?: number
    createdAt?: number | ConditionDate
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    createdAt?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<TicketUserGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class TicketUserPaginationQuery extends TicketUserGetQuery { }
export class TicketUserListQuery extends OmitClass(TicketUserGetQuery, ['page']) { }
export class TicketUserDetailQuery extends PickClass(TicketUserGetQuery, ['relation']) { }
