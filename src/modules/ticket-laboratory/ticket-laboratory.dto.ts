import { OmitClass, PickClass } from '../../utils'

export class TicketLaboratoryGetQuery {
  page: number
  limit?: number
  relation?: {
    ticket?: boolean
    customer?: boolean
    laboratory?: { laboratoryGroup?: boolean } | false
    imageList?: boolean
  }

  filter?: {
    laboratoryId?: number
    customerId?: number
    ticketId?: number
  }

  sort?: { id?: 'ASC' | 'DESC' }

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
