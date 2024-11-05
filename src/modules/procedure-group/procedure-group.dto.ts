import { OmitClass, PickClass } from '../../utils'

export class ProcedureGroupGetQuery {
  page?: number
  limit?: number
  relation?: {}
  filter?: {}

  sort?: {
    id?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<ProcedureGroupGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class ProcedureGroupPaginationQuery extends ProcedureGroupGetQuery {}
export class ProcedureGroupListQuery extends OmitClass(ProcedureGroupGetQuery, ['page']) {}
export class ProcedureGroupDetailQuery extends PickClass(ProcedureGroupGetQuery, ['relation']) {}
