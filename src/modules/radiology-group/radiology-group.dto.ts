import { OmitClass, PickClass } from '../../utils'

export class RadiologyGroupGetQuery {
  page?: number
  limit?: number
  relation?: {}
  filter?: {}

  sort?: {
    id?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<RadiologyGroupGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class RadiologyGroupPaginationQuery extends RadiologyGroupGetQuery {}
export class RadiologyGroupListQuery extends OmitClass(RadiologyGroupGetQuery, ['page']) {}
export class RadiologyGroupDetailQuery extends PickClass(RadiologyGroupGetQuery, ['relation']) {}
