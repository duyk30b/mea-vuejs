import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionEnum, ConditionNumber } from '../_base/base-condition'
import type { DeliveryStatus } from '../enum'
import type { TicketLaboratoryListQuery } from '../ticket-laboratory'
import type { TicketLaboratoryGroupListQuery } from '../ticket-laboratory-group'
import type { TicketProcedureListQuery } from '../ticket-procedure'
import type { TicketProductListQuery } from '../ticket-product'
import type { TicketRadiologyListQuery } from '../ticket-radiology'
import type { TicketStatus } from './ticket.model'

export class TicketFilterQuery {
  roomId?: number | ConditionNumber
  customerId?: number
  status?: TicketStatus | ConditionEnum<TicketStatus>
  deliveryStatus?: DeliveryStatus | ConditionEnum<DeliveryStatus>
  registeredAt?: ConditionDate
  startedAt?: ConditionDate
  updatedAt?: ConditionDate
  $OR?: TicketFilterQuery[]
  $AND?: TicketFilterQuery[]
}

export class TicketGetQuery {
  page?: number
  limit?: number
  relation?: {
    customer?: boolean
    paymentList?: boolean
    ticketSurchargeList?: boolean
    ticketExpenseList?: boolean
    ticketAttributeList?: boolean
    ticketProductList?: TicketProductListQuery
    ticketBatchList?: { batch?: boolean }
    ticketProductConsumableList?: TicketProductListQuery
    ticketProductPrescriptionList?: TicketProductListQuery
    ticketProcedureList?: TicketProcedureListQuery
    ticketLaboratoryList?: TicketLaboratoryListQuery
    ticketLaboratoryGroupList?: TicketLaboratoryGroupListQuery
    ticketLaboratoryResultList?: boolean
    ticketRadiologyList?: TicketRadiologyListQuery
    ticketUserList?: { user?: boolean }
    toAppointment?: boolean
    customerSource?: boolean
    imageList?: boolean
  }

  filter?: TicketFilterQuery

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

export class TicketPaginationQuery extends TicketGetQuery { }
export class TicketListQuery extends OmitClass(TicketGetQuery, ['page']) { }
export class TicketDetailQuery extends PickClass(TicketGetQuery, ['relation']) { }
