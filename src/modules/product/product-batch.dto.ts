import { Expose, Transform, Type, instanceToPlain, plainToInstance } from 'class-transformer'
import type { ComparisonType } from '../enum'
import { PaginationQuery } from '../pagination'

export class ProductBatchFilterQuery {
  @Expose()
  productId?: number

  @Expose()
  isActive?: 1 | 0

  @Expose()
  @Transform(({ value }) => JSON.stringify(value), { toPlainOnly: true })
  quantity?: [ComparisonType, number]

  @Expose()
  @Transform(({ value }) => JSON.stringify(value), { toPlainOnly: true })
  expiryDate?: [ComparisonType, string | number]

  product?: { group?: string; searchText?: string; isActive?: 1 | 0 }
}

export class ProductBatchRelationQuery {
  @Expose()
  product?: boolean
}

export class ProductBatchSortQuery {
  @Expose()
  id?: 'ASC' | 'DESC'

  @Expose()
  expiryDate?: 'ASC' | 'DESC'
}

export class ProductBatchPaginationQuery extends PaginationQuery {
  @Expose()
  @Type(() => ProductBatchFilterQuery)
  filter?: ProductBatchFilterQuery

  @Expose()
  @Type(() => ProductBatchRelationQuery)
  relation?: ProductBatchRelationQuery

  @Expose()
  @Type(() => ProductBatchSortQuery)
  sort?: ProductBatchSortQuery

  static plainFromPlain(plain: Record<string, any>): Record<string, any> {
    const instance = plainToInstance(ProductBatchPaginationQuery, plain, { ignoreDecorators: true })
    
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}

export class ProductBatchListQuery {
  @Expose()
  limit?: number

  @Expose()
  @Type(() => ProductBatchFilterQuery)
  filter?: ProductBatchFilterQuery

  @Expose()
  @Type(() => ProductBatchRelationQuery)
  relation?: ProductBatchRelationQuery

  static plainFromPlain(plain: Record<string, any>): Record<string, any> {
    const instance = plainToInstance(ProductBatchListQuery, plain, { ignoreDecorators: true })
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}

export class ProductBatchDetailQuery {
  @Expose()
  @Type(() => ProductBatchRelationQuery)
  relation?: ProductBatchRelationQuery

  static plainFromPlain(plain: Record<string, any>): Record<string, any> {
    const instance = plainToInstance(ProductBatchDetailQuery, plain, { ignoreDecorators: true })
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}
