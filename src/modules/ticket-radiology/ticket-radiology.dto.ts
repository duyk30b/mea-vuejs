import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate } from '../_base/base-condition'

export class TicketRadiologyGetQuery {
  page: number
  limit?: number
  relation?: {
    ticket?: boolean
    customer?: boolean
    radiology?: { radiologyGroup?: boolean; printHtml?: boolean } | false
    imageList?: boolean
  }

  filter?: {
    radiologyId?: number
    customerId?: number
    ticketId?: number
    startedAt?: ConditionDate
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    startedAt?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<TicketRadiologyGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class TicketRadiologyPaginationQuery extends TicketRadiologyGetQuery {}
export class TicketRadiologyListQuery extends OmitClass(TicketRadiologyGetQuery, ['page']) {}
export class TicketRadiologyDetailQuery extends PickClass(TicketRadiologyGetQuery, ['relation']) {}
