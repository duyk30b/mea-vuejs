import { Expose, Transform, Type, instanceToPlain, plainToInstance } from 'class-transformer'
import { PaginationQuery } from '../pagination'
import type { ComparisonType } from '../enum'

export class CustomerFilterQuery {
  @Expose()
  isActive?: 1 | 0

  @Expose()
  searchText?: string

  @Expose()
  @Transform(({ value }) => JSON.stringify(value), { toPlainOnly: true })
  debt?: [ComparisonType, number]
}

export class CustomerSortQuery {
  @Expose()
  id?: 'ASC' | 'DESC'

  @Expose()
  debt?: 'ASC' | 'DESC'

  @Expose()
  fullName?: 'ASC' | 'DESC'
}

export class CustomerPaginationQuery extends PaginationQuery {
  @Expose()
  @Type(() => CustomerFilterQuery)
  filter?: CustomerFilterQuery

  @Expose()
  @Type(() => CustomerSortQuery)
  sort?: CustomerSortQuery

  static plainFromPlain(plain: Record<string, any>): Record<string, any> {
    const instance = plainToInstance(CustomerPaginationQuery, plain, { ignoreDecorators: true })
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}

export class CustomerListQuery {
  @Expose()
  limit?: number

  @Expose()
  @Type(() => CustomerFilterQuery)
  filter?: CustomerFilterQuery

  static plainFromPlain(plain: Record<string, any>): Record<string, any> {
    const instance = plainToInstance(CustomerListQuery, plain, { ignoreDecorators: true })
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}
