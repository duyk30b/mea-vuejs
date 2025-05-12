import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionNumber } from '../_base/base-condition'

export class CustomerGetQuery {
  page?: number
  limit?: number
  relation?: {
    paymentList: boolean
  }

  filter?: {
    isActive?: 1 | 0
    searchText?: string
    debt?: ConditionNumber
    updatedAt?: ConditionDate
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    debt?: 'ASC' | 'DESC'
    fullName?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<CustomerGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class CustomerPaginationQuery extends CustomerGetQuery {}
export class CustomerListQuery extends OmitClass(CustomerGetQuery, ['page']) {}
export class CustomerDetailQuery extends PickClass(CustomerGetQuery, ['relation']) {}
