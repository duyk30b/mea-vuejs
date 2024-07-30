import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionNumber, ConditionString } from '../_base/base-condition'

export class DistributorGetQuery {
  page?: number
  limit?: number
  relation?: {}
  filter?: {
    isActive?: 1 | 0
    searchText?: string
    debt?: ConditionNumber
    updatedAt?: ConditionDate
    fullName?: ConditionString
    $OR?: [{ fullName: ConditionString }, { phone: ConditionString }]
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    debt?: 'ASC' | 'DESC'
    fullName?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<DistributorGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class DistributorPaginationQuery extends DistributorGetQuery {}
export class DistributorListQuery extends OmitClass(DistributorGetQuery, ['page']) {}
export class DistributorDetailQuery extends PickClass(DistributorGetQuery, ['relation']) {}
