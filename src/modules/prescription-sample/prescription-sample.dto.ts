import { OmitClass, PickClass } from '../../utils'

export class PrescriptionSampleGetQuery {
  page?: number
  limit?: number
  relation?: {
    medicineList?: boolean
  }

  filter?: {}

  sort?: {
    id?: 'ASC' | 'DESC'
    priority?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<PrescriptionSampleGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class PrescriptionSamplePaginationQuery extends PrescriptionSampleGetQuery {}
export class PrescriptionSampleListQuery extends OmitClass(PrescriptionSampleGetQuery, ['page']) {}
export class PrescriptionSampleDetailQuery extends PickClass(PrescriptionSampleGetQuery, [
  'relation',
]) {}
