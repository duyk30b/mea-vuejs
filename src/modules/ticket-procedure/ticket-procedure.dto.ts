import { OmitClass, PickClass } from '../../utils'
import type {
  ConditionDate,
  ConditionEnum,
  ConditionNumber,
  ConditionString,
} from '../_base/base-condition'
import type { PaymentMoneyStatus } from '../enum'
import type { TicketProcedureStatus, TicketProcedureType } from './ticket-procedure.model'

export class TicketProcedureGetQuery {
  page: number
  limit?: number
  relation?: {
    ticket?: boolean
    customer?: boolean
    procedure?: boolean
    ticketUserRequestList?: boolean
    ticketUserResultList?: boolean
    imageList?: boolean
  }

  filter?: {
    ticketId?: string | ConditionString
    ticketRegimenId?: string | ConditionString
    customerId?: number
    procedureId?: number
    ticketProcedureType?: TicketProcedureType | ConditionEnum<TicketProcedureType>
    paymentMoneyStatus?: PaymentMoneyStatus | ConditionEnum<PaymentMoneyStatus>
    status?: TicketProcedureStatus | ConditionEnum<TicketProcedureStatus>
    createdAt?: ConditionDate
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    completedAt?: 'ASC' | 'DESC'
  }

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

export class TicketProcedurePaginationQuery extends TicketProcedureGetQuery { }
export class TicketProcedureListQuery extends OmitClass(TicketProcedureGetQuery, ['page']) { }
export class TicketProcedureDetailQuery extends PickClass(TicketProcedureGetQuery, ['relation']) { }
