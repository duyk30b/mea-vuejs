import { OmitClass, PickClass } from '../../utils'

export class RoleCommissionGetQuery {
  page?: number
  limit?: number
  relation?: {}
  filter?: {}

  sort?: {
    id?: 'ASC' | 'DESC'
    roleInteractType?: 'ASC' | 'DESC'
    roleId?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<RoleCommissionGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class RoleCommissionPaginationQuery extends RoleCommissionGetQuery {}
export class RoleCommissionListQuery extends OmitClass(RoleCommissionGetQuery, ['page']) {}
export class RoleCommissionDetailQuery extends PickClass(RoleCommissionGetQuery, ['relation']) {}
