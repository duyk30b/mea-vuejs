import { OmitClass, PickClass } from '../../utils'
import type { InvoiceItemType } from './invoice-item.model'

export class InvoiceItemGetQuery {
  page: number
  limit?: number
  relation?: {
    invoice?: boolean | { customer?: boolean }
    batch?: boolean
    product?: boolean
    procedure?: boolean
  }

  filter?: {
    productId?: number
    procedureId?: number
    batchId?: number
    customerId?: number
    type?: InvoiceItemType
  }

  sort?: { id?: 'ASC' | 'DESC' }

  static toQuery(instance: Partial<InvoiceItemGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class InvoiceItemPaginationQuery extends InvoiceItemGetQuery {}
export class InvoiceItemListQuery extends OmitClass(InvoiceItemGetQuery, ['page']) {}
export class InvoiceItemDetailQuery extends PickClass(InvoiceItemGetQuery, ['relation']) {}
