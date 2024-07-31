import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionEnum } from '../_base/base-condition'
import type { VoucherType } from '../enum'
import type { TicketStatus } from './ticket.model'

export class TicketGetQuery {
  page: number
  limit?: number
  relation?: {
    customer?: boolean
    user?: boolean
    customerPaymentList?: boolean
    ticketProductList?: boolean
    ticketProcedureList?: boolean
    ticketRadiologyList?: boolean
    ticketDiagnosis?: boolean
    ticketSurchargeList?: boolean
    ticketExpenseList?: boolean
  }

  filter?: {
    customerId?: number
    voucherType?: VoucherType | ConditionEnum<VoucherType>
    registeredAt?: ConditionDate
    startedAt?: ConditionDate
    updatedAt?: ConditionDate
    ticketStatus?: TicketStatus
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    registeredAt?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<TicketGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class TicketPaginationQuery extends TicketGetQuery {}
export class TicketListQuery extends OmitClass(TicketGetQuery, ['page']) {}
export class TicketDetailQuery extends PickClass(TicketGetQuery, ['relation']) {}
export class TicketSumDebtQuery extends PickClass(TicketGetQuery, ['filter']) {}
