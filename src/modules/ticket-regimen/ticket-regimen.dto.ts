import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionEnum, ConditionNumber } from '../_base/base-condition'
import type { PaymentMoneyStatus } from '../enum'

export class TicketRegimenGetQuery {
  page: number
  limit?: number
  relation?: {
    ticket?: boolean
    customer?: boolean
    regimen?: boolean
    ticketRegimenItemList?: boolean
    ticketProcedureList?: {
      imageList?: boolean
      ticketUserResultList?: boolean
    }
    ticketUserRequestList?: boolean
  }

  filter?: {
    ticketId?: number | ConditionNumber
    customerId?: number
    regimenId?: number
    paymentMoneyStatus?: PaymentMoneyStatus | ConditionEnum<PaymentMoneyStatus>
    createdAt?: ConditionDate
  }

  sort?: { id?: 'ASC' | 'DESC' }

  static toQuery(instance: Partial<TicketRegimenGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class TicketRegimenPaginationQuery extends TicketRegimenGetQuery { }
export class TicketRegimenListQuery extends OmitClass(TicketRegimenGetQuery, ['page']) { }
export class TicketRegimenDetailQuery extends PickClass(TicketRegimenGetQuery, ['relation']) { }
