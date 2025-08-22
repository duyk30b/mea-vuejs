import { OmitClass, PickClass } from '../../utils'

export class SurchargeGetQuery {
  page?: number
  limit?: number
  relation?: object
  filter?: object

  sort?: {
    id?: 'ASC' | 'DESC'
    priority?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<SurchargeGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class SurchargePaginationQuery extends SurchargeGetQuery {}
export class SurchargeListQuery extends OmitClass(SurchargeGetQuery, ['page']) {}
export class SurchargeDetailQuery extends PickClass(SurchargeGetQuery, ['relation']) {}
