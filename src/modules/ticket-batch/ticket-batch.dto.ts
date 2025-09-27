import { OmitClass, PickClass } from '../../utils'
import type { ConditionEnum } from '../_base/base-condition'
import type { DeliveryStatus } from '../enum'

export class TicketBatchGetQuery {
  page: number
  limit?: number
  relation?: {
    ticket?: boolean
    customer?: boolean
    product?: boolean
    batch?: boolean
  }

  filter?: {
    ticketId?: string
    customerId?: number
    productId?: number
    batchId?: number
    deliveryStatus?: DeliveryStatus | ConditionEnum<DeliveryStatus>
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    ticketProductId?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<TicketBatchGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class TicketBatchPaginationQuery extends TicketBatchGetQuery {}
export class TicketBatchListQuery extends OmitClass(TicketBatchGetQuery, ['page']) {}
export class TicketBatchDetailQuery extends PickClass(TicketBatchGetQuery, ['relation']) {}
