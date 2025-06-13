import { OmitClass, PickClass } from '../../utils'
import type { ConditionNumber, ConditionString } from '../_base/base-condition'

export class RadiologySampleGetQuery {
  page?: number
  limit?: number
  relation?: {
    radiology?: boolean
    printHtml?: boolean
    user?: boolean
  }

  filter?: {
    name?: ConditionString
    radiologyId?: number | ConditionNumber
    userId?: number | ConditionNumber
    printHtmlId?: number
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    radiologyId?: 'ASC' | 'DESC'
    priority?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<RadiologySampleGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class RadiologySamplePaginationQuery extends RadiologySampleGetQuery { }
export class RadiologySampleListQuery extends OmitClass(RadiologySampleGetQuery, ['page']) { }
export class RadiologySampleDetailQuery extends PickClass(RadiologySampleGetQuery, ['relation']) { }
