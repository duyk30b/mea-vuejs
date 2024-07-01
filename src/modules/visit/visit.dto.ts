import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate } from '../_base/base-condition'
import type { VisitStatus, VisitType } from './visit.model'

export class VisitGetQuery {
  page: number
  limit?: number
  relation?: {
    customer?: boolean
    customerPaymentList?: boolean
    visitProductList?: boolean
    visitProcedureList?: boolean
    visitRadiologyList?: boolean
    visitDiagnosis?: boolean
    visitSurchargeList?: boolean
    visitExpenseList?: boolean
  }

  filter?: {
    customerId?: number
    registeredAt?: ConditionDate
    startedAt?: ConditionDate
    updatedAt?: ConditionDate
    visitStatus?: VisitStatus
    visitType?: VisitType
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    registeredAt?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<VisitGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class VisitPaginationQuery extends VisitGetQuery {}
export class VisitListQuery extends OmitClass(VisitGetQuery, ['page']) {}
export class VisitDetailQuery extends PickClass(VisitGetQuery, ['relation']) {}
export class VisitSumDebtQuery extends PickClass(VisitGetQuery, ['filter']) {}
