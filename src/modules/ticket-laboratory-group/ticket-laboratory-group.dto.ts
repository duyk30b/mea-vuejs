import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate } from '../_base/base-condition'

export class TicketLaboratoryGroupGetQuery {
  page: number
  limit?: number
  relation?: {
    ticket?: boolean
    customer?: boolean
    imageList?: boolean
  }

  filter?: {
    laboratoryGroupId?: number
    customerId?: number
    ticketId?: number
    startedAt?: ConditionDate
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    startedAt?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<TicketLaboratoryGroupGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class TicketLaboratoryGroupPaginationQuery extends TicketLaboratoryGroupGetQuery {}
export class TicketLaboratoryGroupListQuery extends OmitClass(TicketLaboratoryGroupGetQuery, ['page']) {}
export class TicketLaboratoryGroupDetailQuery extends PickClass(TicketLaboratoryGroupGetQuery, [
  'relation',
]) {}
