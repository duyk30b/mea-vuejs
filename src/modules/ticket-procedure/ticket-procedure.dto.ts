import { OmitClass, PickClass } from '../../utils'

export class TicketProcedureGetQuery {
  page: number
  limit?: number
  relation?: {
    ticket?: boolean
    customer?: boolean
    procedure?: boolean
  }

  filter?: {
    procedureId?: number
    customerId?: number
    ticketId?: number
  }

  sort?: { id?: 'ASC' | 'DESC' }

  static toQuery(instance: Partial<TicketProcedureGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class TicketProcedurePaginationQuery extends TicketProcedureGetQuery {}
export class TicketProcedureListQuery extends OmitClass(TicketProcedureGetQuery, ['page']) {}
export class TicketProcedureDetailQuery extends PickClass(TicketProcedureGetQuery, ['relation']) {}
