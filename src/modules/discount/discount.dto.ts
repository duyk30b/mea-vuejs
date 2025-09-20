import { OmitClass, PickClass } from '../../utils'
import type { ConditionEnum } from '../_base/base-condition'
import type { DiscountInteractType } from './discount.model'

export class DiscountGetQuery {
  page?: number
  limit?: number
  relation?: {
    product?: boolean
    regimen?: boolean
    procedure?: boolean
    radiology?: boolean
    laboratory?: boolean
  }

  filter?: {
    discountInteractType?: DiscountInteractType | ConditionEnum<DiscountInteractType>
    discountInteractId?: number
  }

  sort?: {
    id?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<DiscountGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class DiscountPaginationQuery extends DiscountGetQuery { }
export class DiscountListQuery extends OmitClass(DiscountGetQuery, ['page']) { }
export class DiscountDetailQuery extends PickClass(DiscountGetQuery, ['relation']) { }
