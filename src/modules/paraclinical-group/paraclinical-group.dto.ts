import { OmitClass, PickClass } from '../../utils'

export class ParaclinicalGroupGetQuery {
  page?: number
  limit?: number
  relation?: {}
  filter?: {}

  sort?: {
    id?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<ParaclinicalGroupGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class ParaclinicalGroupPaginationQuery extends ParaclinicalGroupGetQuery {}
export class ParaclinicalGroupListQuery extends OmitClass(ParaclinicalGroupGetQuery, ['page']) {}
export class ParaclinicalGroupDetailQuery extends PickClass(ParaclinicalGroupGetQuery, ['relation']) {}
