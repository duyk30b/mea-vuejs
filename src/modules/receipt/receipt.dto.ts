import { Expose, Transform, Type, instanceToPlain, plainToInstance } from 'class-transformer'
import type { ComparisonType } from '../enum'
import type { ReceiptStatus } from './receipt.model'
import { PaginationQuery } from '../pagination'

export class ReceiptFilterQuery {
  @Expose()
  distributorId?: number

  @Expose()
  @Transform(({ value }) => JSON.stringify(value), { toPlainOnly: true })
  time?: [ComparisonType, (string | number)?, (string | number)?]

  @Expose()
  @Transform(({ value }) => JSON.stringify(value), { toPlainOnly: true })
  deleteTime?: [ComparisonType, (string | number)?, (string | number)?]

  @Expose()
  status?: ReceiptStatus
}

export class ReceiptRelationQuery {
  @Expose()
  distributor?: boolean

  @Expose()
  distributorPayments?: boolean

  @Expose()
  receiptItems?: boolean
}

export class ReceiptSortQuery {
  @Expose()
  id?: 'ASC' | 'DESC'
}

export class ReceiptPaginationQuery extends PaginationQuery {
  @Expose()
  @Type(() => ReceiptFilterQuery)
  filter?: ReceiptFilterQuery

  @Expose()
  @Type(() => ReceiptRelationQuery)
  relation?: ReceiptRelationQuery

  @Expose()
  @Type(() => ReceiptSortQuery)
  sort?: ReceiptSortQuery

  static plainFromPlain(plain: Record<string, any>): Record<string, any> {
    const instance = plainToInstance(ReceiptPaginationQuery, plain, { ignoreDecorators: true })
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}

export class ReceiptListQuery {
  @Expose()
  limit?: number

  @Expose()
  @Type(() => ReceiptFilterQuery)
  filter?: ReceiptFilterQuery

  @Expose()
  @Type(() => ReceiptRelationQuery)
  relation?: ReceiptRelationQuery

  static plainFromPlain(plain: Record<string, any>): Record<string, any> {
    const instance = plainToInstance(ReceiptListQuery, plain, { ignoreDecorators: true })
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}

export class ReceiptDetailQuery {
  @Expose()
  @Type(() => ReceiptRelationQuery)
  relation?: ReceiptRelationQuery

  static plainFromPlain(plain: Record<string, any>): Record<string, any> {
    const instance = plainToInstance(ReceiptDetailQuery, plain, { ignoreDecorators: true })
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}
