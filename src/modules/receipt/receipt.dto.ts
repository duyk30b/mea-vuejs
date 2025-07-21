import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionEnum } from '../_base/base-condition'
import type { ReceiptStatus } from './receipt.model'

export class ReceiptGetQuery {
  page?: number
  limit?: number
  relation?: {
    distributor?: boolean
    paymentItemList?: boolean
    receiptItemList?: { product?: boolean; batch?: boolean } | false
  }

  filter?: {
    distributorId?: number
    startedAt?: ConditionDate
    status?: ReceiptStatus | ConditionEnum<ReceiptStatus>
  }

  sort?: {
    id?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<ReceiptGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class ReceiptPaginationQuery extends ReceiptGetQuery {}
export class ReceiptListQuery extends OmitClass(ReceiptGetQuery, ['page']) {}
export class ReceiptDetailQuery extends PickClass(ReceiptGetQuery, ['relation']) {}
