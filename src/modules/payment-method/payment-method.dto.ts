import { OmitClass, PickClass } from '../../utils'

export class PaymentMethodGetQuery {
  page?: number
  limit?: number
  relation?: object
  filter?: object

  sort?: {
    id?: 'ASC' | 'DESC'
    priority?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<PaymentMethodGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class PaymentMethodPaginationQuery extends PaymentMethodGetQuery {}
export class PaymentMethodListQuery extends OmitClass(PaymentMethodGetQuery, ['page']) {}
export class PaymentMethodDetailQuery extends PickClass(PaymentMethodGetQuery, ['relation']) {}
