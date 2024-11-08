import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionEnum } from '../_base/base-condition'
import type { VoucherType } from '../enum'
import type { TicketStatus } from './ticket.model'

export class TicketGetQuery {
  page: number
  limit?: number
  relation?: {
    customer?: boolean
    customerPaymentList?: boolean
    ticketProductList?: { product?: boolean; batch?: boolean } | false
    ticketProductConsumableList?: { product?: boolean; batch?: boolean } | false
    ticketProductPrescriptionList?: { product?: boolean; batch?: boolean } | false
    ticketProcedureList?: { procedure?: boolean } | false
    ticketRadiologyList?: { radiology?: boolean } | false
    ticketDiagnosis?: boolean
    ticketSurchargeList?: boolean
    ticketExpenseList?: boolean
    ticketUserList?: { user?: boolean } | false
    toAppointment?: boolean
  }

  filter?: {
    customerId?: number
    ticketStatus?: TicketStatus | ConditionEnum<TicketStatus>
    voucherType?: VoucherType | ConditionEnum<VoucherType>
    registeredAt?: ConditionDate
    startedAt?: ConditionDate
    updatedAt?: ConditionDate
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
