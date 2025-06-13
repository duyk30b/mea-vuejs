import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate } from '../_base/base-condition'

export class TicketLaboratoryGetQuery {
  page: number
  limit?: number
  relation?: {
    ticket?: boolean
    customer?: boolean
    laboratory?: boolean
    imageList?: boolean
  }

  filter?: {
    laboratoryId?: number
    customerId?: number
    ticketId?: number
    startedAt?: ConditionDate
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    startedAt?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<TicketLaboratoryGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class TicketLaboratoryPaginationQuery extends TicketLaboratoryGetQuery {}
export class TicketLaboratoryListQuery extends OmitClass(TicketLaboratoryGetQuery, ['page']) {}
export class TicketLaboratoryDetailQuery extends PickClass(TicketLaboratoryGetQuery, [
  'relation',
]) {}
