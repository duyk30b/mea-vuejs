import { OmitClass, PickClass } from '../../utils'
import type { ConditionString } from '../_base/base-condition'

export class AttributeGetQuery {
  page?: number
  limit?: number
  relation?: {}

  filter?: {
    key?: ConditionString
  }

  sort?: {
    key?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<AttributeGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class AttributePaginationQuery extends AttributeGetQuery { }
export class AttributeListQuery extends OmitClass(AttributeGetQuery, ['page']) { }
export class AttributeDetailQuery extends PickClass(AttributeGetQuery, ['relation']) { }
