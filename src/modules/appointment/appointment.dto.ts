import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionEnum } from '../_base/base-condition'
import type { AppointmentStatus } from './appointment.model'

export class AppointmentGetQuery {
  page: number
  limit?: number
  relation?: {
    customer?: boolean
    customerSource?: boolean
    toTicket?: boolean
  }

  filter?: {
    customerId?: number
    status?: AppointmentStatus | ConditionEnum<AppointmentStatus>
    registeredAt?: ConditionDate
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    registeredAt?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<AppointmentGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class AppointmentPaginationQuery extends AppointmentGetQuery { }
export class AppointmentListQuery extends OmitClass(AppointmentGetQuery, ['page']) { }
export class AppointmentDetailQuery extends PickClass(AppointmentGetQuery, ['relation']) { }
export class AppointmentSumDebtQuery extends PickClass(AppointmentGetQuery, ['filter']) { }
