import { OmitClass, PickClass } from '../../utils'

export class TicketParaclinicalGetQuery {
  page: number
  limit?: number
  relation?: {
    ticket?: boolean
    customer?: boolean
    paraclinical?:
      | { paraclinicalAttributeList?: boolean; paraclinicalGroup?: boolean; printHtml?: boolean }
      | false
    imageList?: boolean
  }

  filter?: {
    paraclinicalId?: number
    customerId?: number
    ticketId?: number
  }

  sort?: { id?: 'ASC' | 'DESC' }

  static toQuery(instance: Partial<TicketParaclinicalGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class TicketParaclinicalPaginationQuery extends TicketParaclinicalGetQuery {}
export class TicketParaclinicalListQuery extends OmitClass(TicketParaclinicalGetQuery, ['page']) {}
export class TicketParaclinicalDetailQuery extends PickClass(TicketParaclinicalGetQuery, [
  'relation',
]) {}
