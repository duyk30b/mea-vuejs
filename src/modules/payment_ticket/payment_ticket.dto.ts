import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionEnum } from '../_base/base-condition'
import type { TicketActionType } from '../ticket/ticket.type'
import type { PaymentTicketItemType } from './payment_ticket.model'

export class PaymentTicketGetParams {
  page?: number
  limit?: number
  relation?: {
    payment?: boolean
    ticket?: boolean
    regimen?: boolean
    procedure?: boolean
    product?: boolean
    laboratoryGroup?: boolean
    radiology?: boolean
  }

  filter?: {
    paymentId?: number
    ticketId?: string
    ticketActionType?: TicketActionType | ConditionEnum<TicketActionType>
    paymentTicketItemType?: PaymentTicketItemType | ConditionEnum<PaymentTicketItemType>
    createdAt?: ConditionDate
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    createdAt?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<PaymentTicketGetParams>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class PaymentTicketPaginationQuery extends PaymentTicketGetParams { }
export class PaymentTicketListQuery extends OmitClass(PaymentTicketGetParams, ['page']) { }
export class PaymentTicketDetailQuery extends PickClass(PaymentTicketGetParams, ['relation']) { }
