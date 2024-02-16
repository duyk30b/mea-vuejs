import { OmitClass, PickClass } from '../../utils'

export interface CustomerPaymentPayDebtBody {
  customerId: number
  note: string
  invoicePayments: { invoiceId: number; money: number }[]
}

export class CustomerPaymentGetQuery {
  page: number
  limit?: number
  relation?: {}
  filter: { customerId: number }
  sort?: { id?: 'ASC' | 'DESC' }

  static toQuery(instance: Partial<CustomerPaymentGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class CustomerPaymentPaginationQuery extends CustomerPaymentGetQuery {}
export class CustomerPaymentListQuery extends OmitClass(CustomerPaymentGetQuery, ['page']) {}
export class CustomerPaymentDetailQuery extends PickClass(CustomerPaymentGetQuery, ['relation']) {}
