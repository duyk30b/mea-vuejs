import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate } from '../_base/base-condition'

export class WarehouseGetQuery {
  page?: number
  limit?: number
  relation?: {}
  filter?: {
    updatedAt?: ConditionDate
  }

  sort?: {
    id?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<WarehouseGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class WarehousePaginationQuery extends WarehouseGetQuery {}
export class WarehouseListQuery extends OmitClass(WarehouseGetQuery, ['page']) {}
export class WarehouseDetailQuery extends PickClass(WarehouseGetQuery, ['relation']) {}
