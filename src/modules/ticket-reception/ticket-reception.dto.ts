import { OmitClass, PickClass } from '../../utils'
import type { ConditionNumber } from '../_base/base-condition'

export class TicketReceptionGetQuery {
  page?: number
  limit?: number
  relation?: {
    ticket?: boolean
    room?: boolean
    customer?: boolean
    customerSource?: boolean
  }

  filter?: {
    ticketId?: number
    roomId?: number
    customerId?: number
    customerSourceId?: number
    receptionAt?: number | ConditionNumber
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    receptionAt?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<TicketReceptionGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class TicketReceptionPaginationQuery extends TicketReceptionGetQuery { }
export class TicketReceptionListQuery extends OmitClass(TicketReceptionGetQuery, ['page']) { }
export class TicketReceptionDetailQuery extends PickClass(TicketReceptionGetQuery, ['relation']) { }
