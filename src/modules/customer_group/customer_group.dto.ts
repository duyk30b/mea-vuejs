import { OmitClass, PickClass } from '../../utils'

export class CustomerGroupGetQuery {
  page?: number
  limit?: number
  relation?: { productList?: boolean }
  filter?: { id: string }

  sort?: {
    id?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<CustomerGroupGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class CustomerGroupPaginationQuery extends CustomerGroupGetQuery { }
export class CustomerGroupListQuery extends OmitClass(CustomerGroupGetQuery, ['page']) { }
export class CustomerGroupDetailQuery extends PickClass(CustomerGroupGetQuery, ['relation']) { }
