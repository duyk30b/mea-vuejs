import type { MovementType } from '../enum'

export class ProductMovementGetQuery {
  page?: number
  limit?: number
  relation?: {
    product?: boolean
    invoice?: boolean
    receipt?: boolean
  }

  filter?: {
    productId?: number
    type?: MovementType
  }

  sort?: {
    id?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<ProductMovementGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class ProductMovementPaginationQuery extends ProductMovementGetQuery {}
