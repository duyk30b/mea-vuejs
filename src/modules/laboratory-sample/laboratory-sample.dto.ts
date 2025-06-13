import { OmitClass, PickClass } from '../../utils'

export class LaboratorySampleGetQuery {
  page?: number
  limit?: number
  relation?: object
  filter?: {
    id?: number
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    priority?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<LaboratorySampleGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class LaboratorySamplePaginationQuery extends LaboratorySampleGetQuery {}
export class LaboratorySampleListQuery extends OmitClass(LaboratorySampleGetQuery, ['page']) {}
export class LaboratorySampleDetailQuery extends PickClass(LaboratorySampleGetQuery, [
  'relation',
]) {}
