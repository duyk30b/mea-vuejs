import { OmitClass, PickClass } from '../../utils'

export class ReceiptItemGetQuery {
  page: number
  limit?: number
  relation?: {
    receipt?: false | { distributor?: boolean }
    batch?: boolean
    product?: boolean
  }

  filter?: {
    distributorId?: number
    receiptId?: number
    productId?: number
    batchId?: number
  }

  sort?: { id?: 'ASC' | 'DESC' }

  static toQuery(instance: Partial<ReceiptItemGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class ReceiptItemPaginationQuery extends ReceiptItemGetQuery {}
export class ReceiptItemListQuery extends OmitClass(ReceiptItemGetQuery, ['page']) {}
export class ReceiptItemDetailQuery extends PickClass(ReceiptItemGetQuery, ['relation']) {}
