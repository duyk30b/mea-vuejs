import { OmitClass, PickClass } from '../../utils'

export class LaboratoryGroupGetQuery {
  page?: number
  limit?: number
  relation?: {}
  filter?: {}

  sort?: {
    id?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<LaboratoryGroupGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class LaboratoryGroupPaginationQuery extends LaboratoryGroupGetQuery {}
export class LaboratoryGroupListQuery extends OmitClass(LaboratoryGroupGetQuery, ['page']) {}
export class LaboratoryGroupDetailQuery extends PickClass(LaboratoryGroupGetQuery, ['relation']) {}
