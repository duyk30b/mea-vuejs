import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate } from '../_base/base-condition'

export class ParaclinicalGetQuery {
  page?: number
  limit?: number
  relation?: {
    paraclinicalGroup?: boolean
    paraclinicalAttributeList?: boolean
    printHtml?: boolean
  }

  filter?: {
    updatedAt?: ConditionDate
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    name?: 'ASC' | 'DESC'
    price?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<ParaclinicalGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class ParaclinicalPaginationQuery extends ParaclinicalGetQuery {}
export class ParaclinicalListQuery extends OmitClass(ParaclinicalGetQuery, ['page']) {}
export class ParaclinicalDetailQuery extends PickClass(ParaclinicalGetQuery, ['relation']) {}
