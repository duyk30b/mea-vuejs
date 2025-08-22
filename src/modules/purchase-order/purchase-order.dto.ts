import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionEnum } from '../_base/base-condition'
import type { PurchaseOrderStatus } from './purchase-order.model'

export class PurchaseOrderGetQuery {
  page?: number
  limit?: number
  relation?: {
    distributor?: boolean
    paymentList?: boolean
    purchaseOrderItemList?: { product?: boolean; batch?: boolean } | false
  }

  filter?: {
    distributorId?: number
    startedAt?: ConditionDate
    status?: PurchaseOrderStatus | ConditionEnum<PurchaseOrderStatus>
  }

  sort?: {
    id?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<PurchaseOrderGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class PurchaseOrderPaginationQuery extends PurchaseOrderGetQuery { }
export class PurchaseOrderListQuery extends OmitClass(PurchaseOrderGetQuery, ['page']) { }
export class PurchaseOrderDetailQuery extends PickClass(PurchaseOrderGetQuery, ['relation']) { }
