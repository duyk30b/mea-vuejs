import { OmitClass, PickClass } from '../../utils'

export class ProductGroupGetQuery {
  page?: number
  limit?: number
  relation?: {}
  filter?: {}

  sort?: {
    id?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<ProductGroupGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class ProductGroupPaginationQuery extends ProductGroupGetQuery {}
export class ProductGroupListQuery extends OmitClass(ProductGroupGetQuery, ['page']) {}
export class ProductGroupDetailQuery extends PickClass(ProductGroupGetQuery, ['relation']) {}
