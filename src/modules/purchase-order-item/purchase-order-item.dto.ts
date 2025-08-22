import { OmitClass, PickClass } from '../../utils'

export class PurchaseOrderItemGetQuery {
  page: number
  limit?: number
  relation?: {
    purchaseOrder?: false | { distributor?: boolean }
    batch?: boolean
    product?: boolean
  }

  filter?: {
    distributorId?: number
    purchaseOrderId?: number
    productId?: number
    batchId?: number
  }

  sort?: { id?: 'ASC' | 'DESC' }

  static toQuery(instance: Partial<PurchaseOrderItemGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class PurchaseOrderItemPaginationQuery extends PurchaseOrderItemGetQuery { }
export class PurchaseOrderItemListQuery extends OmitClass(PurchaseOrderItemGetQuery, ['page']) { }
export class PurchaseOrderItemDetailQuery extends PickClass(PurchaseOrderItemGetQuery, ['relation']) { }
