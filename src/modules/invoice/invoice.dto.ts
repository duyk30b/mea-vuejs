import { Expose, Transform, Type, instanceToPlain, plainToInstance } from 'class-transformer'
import type { ComparisonType } from '../enum'
import type { InvoiceStatus } from './invoice.model'
import { PaginationQuery } from '../pagination'

export class InvoiceFilterQuery {
  @Expose()
  customerId?: number

  @Expose()
  @Transform(({ value }) => JSON.stringify(value), { toPlainOnly: true })
  time?: [ComparisonType, (string | number)?, (string | number)?]

  @Expose()
  @Transform(({ value }) => JSON.stringify(value), { toPlainOnly: true })
  deleteTime?: [ComparisonType, (string | number)?, (string | number)?]

  @Expose()
  status?: InvoiceStatus
}

export class InvoiceRelationQuery {
  @Expose()
  customer?: boolean

  @Expose()
  customerPayments?: boolean

  @Expose()
  invoiceItems?: boolean

  @Expose()
  invoiceSurcharges?: boolean

  @Expose()
  invoiceExpenses?: boolean
}

export class InvoiceSortQuery {
  @Expose()
  id?: 'ASC' | 'DESC'
}

export class InvoicePaginationQuery extends PaginationQuery {
  @Expose()
  @Type(() => InvoiceFilterQuery)
  filter?: InvoiceFilterQuery

  @Expose()
  @Type(() => InvoiceRelationQuery)
  relation?: InvoiceRelationQuery

  @Expose()
  @Type(() => InvoiceSortQuery)
  sort?: InvoiceSortQuery

  static plainFromPlain(plain: Record<string, any>): Record<string, any> {
    const instance = plainToInstance(InvoicePaginationQuery, plain, { ignoreDecorators: true })
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}

export class InvoiceListQuery {
  @Expose()
  limit?: number

  @Expose()
  @Type(() => InvoiceFilterQuery)
  filter?: InvoiceFilterQuery

  @Expose()
  @Type(() => InvoiceRelationQuery)
  relation?: InvoiceRelationQuery

  static plainFromPlain(plain: Record<string, any>): Record<string, any> {
    const instance = plainToInstance(InvoiceListQuery, plain, { ignoreDecorators: true })
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}

export class InvoiceDetailQuery {
  @Expose()
  @Type(() => InvoiceRelationQuery)
  relation?: InvoiceRelationQuery

  static plainFromPlain(plain: Record<string, any>): Record<string, any> {
    const instance = plainToInstance(InvoiceDetailQuery, plain, { ignoreDecorators: true })
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}

export class InvoiceSumDebtQuery {
  @Expose()
  @Type(() => InvoiceFilterQuery)
  filter?: InvoiceFilterQuery

  static plainFromPlain(plain: Record<string, any>): Record<string, any> {
    const instance = plainToInstance(InvoiceListQuery, plain, { ignoreDecorators: true })
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}
