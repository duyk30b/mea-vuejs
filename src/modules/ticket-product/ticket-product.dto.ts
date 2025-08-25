import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionEnum } from '../_base/base-condition'
import type { DeliveryStatus, PaymentMoneyStatus } from '../enum'

export class TicketProductGetQuery {
  page: number
  limit?: number
  relation?: {
    ticket?: boolean
    customer?: boolean
    product?: boolean
  }

  filter?: {
    ticketId?: number
    customerId?: number
    productId?: number
    deliveryStatus?: DeliveryStatus | ConditionEnum<DeliveryStatus>
    paymentMoneyStatus?: PaymentMoneyStatus | ConditionEnum<PaymentMoneyStatus>
    createdAt?: ConditionDate
  }

  sort?: { id?: 'ASC' | 'DESC' }

  static toQuery(instance: Partial<TicketProductGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class TicketProductPaginationQuery extends TicketProductGetQuery { }
export class TicketProductListQuery extends OmitClass(TicketProductGetQuery, ['page']) { }
export class TicketProductDetailQuery extends PickClass(TicketProductGetQuery, ['relation']) { }

export class TicketProductStatisticQuery extends OmitClass(TicketProductGetQuery, ['sort']) { }
