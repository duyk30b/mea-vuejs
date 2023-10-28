import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate } from '../_base/base-condition'
import type { InvoiceStatus } from './invoice.model'

export class InvoiceGetQuery {
  page: number
  limit?: number
  relation?: {
    customer?: boolean
    customerPayments?: boolean
    invoiceItems?: boolean
    invoiceSurcharges?: boolean
    invoiceExpenses?: boolean
  }

  filter?: {
    customerId?: number
    startedAt?: ConditionDate
    deletedAt?: ConditionDate
    status?: InvoiceStatus
  }

  sort?: { id?: 'ASC' | 'DESC' }

  static toQuery(instance: Partial<InvoiceGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class InvoicePaginationQuery extends InvoiceGetQuery {}
export class InvoiceListQuery extends OmitClass(InvoiceGetQuery, ['page']) {}
export class InvoiceDetailQuery extends PickClass(InvoiceGetQuery, ['relation']) {}
export class InvoiceSumDebtQuery extends PickClass(InvoiceGetQuery, ['filter']) {}
