import { OmitClass, PickClass } from '../../utils'

export class LaboratoryKitGetQuery {
  page?: number
  limit?: number
  relation?: {}
  filter?: {}

  sort?: {
    id?: 'ASC' | 'DESC'
    priority?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<LaboratoryKitGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class LaboratoryKitPaginationQuery extends LaboratoryKitGetQuery {}
export class LaboratoryKitListQuery extends OmitClass(LaboratoryKitGetQuery, ['page']) {}
export class LaboratoryKitDetailQuery extends PickClass(LaboratoryKitGetQuery, ['relation']) {}
