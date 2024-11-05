import { OmitClass, PickClass } from '../../utils'

export class CustomerSourceGetQuery {
  page?: number
  limit?: number
  relation?: {}
  filter?: {}

  sort?: {
    id?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<CustomerSourceGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class CustomerSourcePaginationQuery extends CustomerSourceGetQuery {}
export class CustomerSourceListQuery extends OmitClass(CustomerSourceGetQuery, ['page']) {}
export class CustomerSourceDetailQuery extends PickClass(CustomerSourceGetQuery, ['relation']) {}
