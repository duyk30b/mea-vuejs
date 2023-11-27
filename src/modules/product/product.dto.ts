import { Expose, Transform, Type, instanceToPlain, plainToInstance } from 'class-transformer'
import type { ComparisonType } from '../enum'
import { PaginationQuery } from '../pagination'

export class ProductFilterQuery {
  @Expose()
  isActive?: boolean

  @Expose()
  group?: string

  @Expose()
  searchText?: string

  @Expose()
  @Transform(({ value }) => JSON.stringify(value), { toPlainOnly: true })
  quantity?: [ComparisonType, number]
}

export class ProductRelationQuery {
  @Expose()
  productBatches?: boolean
}

export class ProductSortQuery {
  @Expose()
  id?: 'ASC' | 'DESC'

  @Expose()
  quantity?: 'ASC' | 'DESC'

  @Expose()
  brandName?: 'ASC' | 'DESC'
}

export class ProductPaginationQuery extends PaginationQuery {
  @Expose()
  @Type(() => ProductFilterQuery)
  filter?: ProductFilterQuery

  @Expose()
  @Type(() => ProductRelationQuery)
  relation?: ProductRelationQuery

  @Expose()
  @Type(() => ProductSortQuery)
  sort?: ProductSortQuery

  static plainFromPlain(plain: Record<string, any>): Record<string, any> {
    const instance = plainToInstance(ProductPaginationQuery, plain, { ignoreDecorators: true })
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}

export class ProductListQuery {
  @Expose({ name: 'limit' })
  limit?: number

  @Expose({ name: 'filter' })
  @Type(() => ProductFilterQuery)
  filter?: ProductFilterQuery

  @Expose({ name: 'relation' })
  @Type(() => ProductRelationQuery)
  relation?: ProductRelationQuery

  static plainFromPlain(plain: Record<string, any>): Record<string, any> {
    const instance = plainToInstance(ProductListQuery, plain, { ignoreDecorators: true })
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}

export class ProductDetailQuery {
  @Expose({ name: 'relation' })
  @Type(() => ProductRelationQuery)
  relation?: ProductRelationQuery

  static plainFromPlain(plain: Record<string, any>): Record<string, any> {
    const instance = plainToInstance(ProductDetailQuery, plain, { ignoreDecorators: true })
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}
