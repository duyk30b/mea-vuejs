import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionString } from '../_base/base-condition'

export class RadiologyGetQuery {
  page?: number
  limit?: number
  relation?: {
    radiologyGroup?: boolean
    printHtml?: boolean
    positionList?: boolean
    discountList?: boolean
  }

  filter?: {
    name?: ConditionString
    radiologyGroupId?: number
    updatedAt?: ConditionDate
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    name?: 'ASC' | 'DESC'
    radiologyCode?: 'ASC' | 'DESC'
    price?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<RadiologyGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class RadiologyPaginationQuery extends RadiologyGetQuery { }
export class RadiologyListQuery extends OmitClass(RadiologyGetQuery, ['page']) { }
export class RadiologyDetailQuery extends PickClass(RadiologyGetQuery, ['relation']) { }
