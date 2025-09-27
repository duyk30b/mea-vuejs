import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionEnum, ConditionNumber } from '../_base/base-condition'
import type { DeliveryStatus } from '../enum'
import type { TicketStatus } from './ticket.model'

export class TicketFilterQuery {
  roomId?: number | ConditionNumber
  customerId?: number
  status?: TicketStatus | ConditionEnum<TicketStatus>
  deliveryStatus?: DeliveryStatus | ConditionEnum<DeliveryStatus>
  createdAt?: ConditionDate
  receptionAt?: ConditionDate
  $OR?: TicketFilterQuery[]
  $AND?: TicketFilterQuery[]
}

export class TicketGetQuery {
  page?: number
  limit?: number
  relation?: {
    customer?: boolean
    paymentList?: boolean

    ticketReceptionList?: boolean

    ticketAttributeList?: boolean
    ticketSurchargeList?: boolean
    ticketExpenseList?: boolean

    ticketProductList?: boolean
    ticketBatchList?: { batch?: boolean }

    ticketProcedureList?: boolean
    ticketRegimenList?: boolean
    ticketRegimenItemList?: boolean

    ticketLaboratoryList?: boolean
    ticketLaboratoryGroupList?: boolean
    ticketLaboratoryResultList?: boolean

    ticketRadiologyList?: boolean
    ticketUserList?: boolean

    toAppointment?: boolean
    customerSource?: boolean

    imageList?: boolean
  }

  filter?: TicketFilterQuery

  sort?: {
    id?: 'ASC' | 'DESC'
    receptionAt?: 'ASC' | 'DESC',
    createdAt?: 'ASC' | 'DESC',
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

export class TicketPaginationQuery extends TicketGetQuery { }
export class TicketListQuery extends OmitClass(TicketGetQuery, ['page']) { }
export class TicketDetailQuery extends PickClass(TicketGetQuery, ['relation']) { }
