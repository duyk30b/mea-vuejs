import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate } from '../_base/base-condition'

export class VisitGetQuery {
  page: number
  limit?: number
  relation?: {
    customer?: boolean
    customerPayments?: boolean
    visitProductList?: boolean
    visitProcedureList?: boolean
    visitDiagnosis?: boolean
  }

  filter?: {
    customerId?: number
    registeredAt?: ConditionDate
    updatedAt?: ConditionDate
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
