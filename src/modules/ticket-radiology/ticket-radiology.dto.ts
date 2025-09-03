import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionEnum, ConditionNumber } from '../_base/base-condition'
import type { PaymentMoneyStatus } from '../enum'
import type { TicketRadiologyStatus } from './ticket-radiology.model'

export class TicketRadiologyGetQuery {
  page: number
  limit?: number
  relation?: {
    ticket?: boolean
    customer?: boolean
    ticketUserRequestList?: boolean
    ticketUserResultList?: boolean
    radiology?: { radiologyGroup?: boolean; printHtml?: boolean } | false
    imageList?: boolean
  }

  filter?: {
    status?: TicketRadiologyStatus | ConditionEnum<TicketRadiologyStatus>
    paymentMoneyStatus?: PaymentMoneyStatus | ConditionEnum<PaymentMoneyStatus>
    radiologyId?: number
    roomId?: number | ConditionNumber
    customerId?: number
    ticketId?: number
    completedAt?: ConditionDate
    createdAt?: ConditionDate
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    completedAt?: 'ASC' | 'DESC'
    createdAt?: 'ASC' | 'DESC'
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

export class TicketRadiologyPaginationQuery extends TicketRadiologyGetQuery { }
export class TicketRadiologyListQuery extends OmitClass(TicketRadiologyGetQuery, ['page']) { }
export class TicketRadiologyDetailQuery extends PickClass(TicketRadiologyGetQuery, ['relation']) { }
