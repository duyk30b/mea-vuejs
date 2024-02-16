import { OmitClass, PickClass } from '../../utils'

export interface DistributorPaymentPayDebtBody {
  distributorId: number
  note: string
  receiptPayments: { receiptId: number; money: number }[]
}

export class DistributorPaymentGetQuery {
  page: number
  limit?: number
  relation?: {}
  filter: { distributorId: number }
  sort?: { id?: 'ASC' | 'DESC' }

  static toQuery(instance: Partial<DistributorPaymentGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class DistributorPaymentPaginationQuery extends DistributorPaymentGetQuery {}
export class DistributorPaymentListQuery extends OmitClass(DistributorPaymentGetQuery, ['page']) {}
export class DistributorPaymentDetailQuery extends PickClass(DistributorPaymentGetQuery, [
  'relation',
]) {}
