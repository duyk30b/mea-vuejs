import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionEnum, ConditionNumber } from '../_base/base-condition'
import type { PaymentMoneyStatus } from '../enum'
import type { TicketLaboratoryStatus } from '../ticket-laboratory/ticket-laboratory.model'

export class TicketLaboratoryGroupGetQuery {
  page: number
  limit?: number
  relation?: {
    ticket?: boolean
    customer?: boolean
    ticketUserList?: boolean
    ticketLaboratoryList?: boolean
    ticketLaboratoryResultMap?: boolean
    imageList?: boolean
  }

  filter?: {
    laboratoryGroupId?: number
    status?: TicketLaboratoryStatus | ConditionEnum<TicketLaboratoryStatus>
    paymentMoneyStatus?: PaymentMoneyStatus | ConditionEnum<PaymentMoneyStatus>
    customerId?: number
    roomId?: number | ConditionNumber
    ticketId?: number
    registeredAt?: ConditionDate
    createdAt?: ConditionDate
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    registeredAt?: 'ASC' | 'DESC'
    createdAt?: 'ASC' | 'DESC'
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

export class TicketLaboratoryGroupPaginationQuery extends TicketLaboratoryGroupGetQuery { }
export class TicketLaboratoryGroupListQuery extends OmitClass(TicketLaboratoryGroupGetQuery, [
  'page',
]) { }
export class TicketLaboratoryGroupDetailQuery extends PickClass(TicketLaboratoryGroupGetQuery, [
  'relation',
]) { }
