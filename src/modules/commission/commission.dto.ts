import { OmitClass, PickClass } from '../../utils'
import type { InteractType } from './commission.model'

export class CommissionGetQuery {
  page?: number
  limit?: number
  relation?: {
    role?: boolean
    product?: boolean
    procedure?: boolean
    radiology?: boolean
    laboratory?: boolean
  }

  filter?: {
    roleId?: number
    interactType?: InteractType
    interactId?: number
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    interactType?: 'ASC' | 'DESC'
    roleId?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<CommissionGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class CommissionPaginationQuery extends CommissionGetQuery {}
export class CommissionListQuery extends OmitClass(CommissionGetQuery, ['page']) {}
export class CommissionDetailQuery extends PickClass(CommissionGetQuery, ['relation']) {}
