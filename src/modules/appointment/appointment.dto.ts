import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionEnum } from '../_base/base-condition'
import type { AppointmentStatus, AppointmentType } from './appointment.model'

export class AppointmentGetQuery {
  page: number
  limit?: number
  relation?: {
    customer?: boolean
  }

  filter?: {
    customerId?: number
    appointmentStatus?: AppointmentStatus
    appointmentType?: AppointmentType | ConditionEnum<AppointmentType>
    time?: ConditionDate
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    time?: 'ASC' | 'DESC'
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

export class AppointmentPaginationQuery extends AppointmentGetQuery {}
export class AppointmentListQuery extends OmitClass(AppointmentGetQuery, ['page']) {}
export class AppointmentDetailQuery extends PickClass(AppointmentGetQuery, ['relation']) {}
export class AppointmentSumDebtQuery extends PickClass(AppointmentGetQuery, ['filter']) {}
