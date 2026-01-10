import type { NoExtra } from '@/utils'
import type { Dexie, Table } from 'dexie'
import { CollectionQuery, type BaseCondition } from '../common/collection.query'

export class BaseDexieRepository<
  _ENTITY,
  _SORT = {
    [P in keyof _ENTITY]?: 'ASC' | 'DESC' | ((a: string, b: string) => 1 | -1)
  },
> extends CollectionQuery<_ENTITY> {
  private connection: { db: Dexie }
  private collectionName: string

  constructor(connection: { db: Dexie }, collectionName: string) {
    super()
    this.connection = connection
    this.collectionName = collectionName
  }

  get collection(): Table<_ENTITY, number, _ENTITY> {
    return (this.connection.db as any)[this.collectionName]
  }

  async truncate() {
    await this.collection.clear()
  }

  async upsertOne(data: _ENTITY) {
    await this.collection.put(data)
  }
  async upsertMany(data: _ENTITY[]) {
    await this.collection.bulkPut(data)
  }

  async pagination<S extends _SORT>(options: {
    page: number
    limit: number
    filter?: BaseCondition<_ENTITY>
    sort?: NoExtra<_SORT, S>
  }) {
    const { filter, sort, page, limit } = options
    let data: _ENTITY[] = []

    if (filter) {
      data = await this.collection.filter((record) => this.executeFilter(record, filter)).toArray()
    } else {
      data = await this.collection.toArray()
    }

    if (sort) {
      data = this.executeSort(data, sort)
    }

    const start = (page - 1) * limit
    const end = page * limit

    return {
      total: data.length,
      page,
      limit,
      data: data.slice(start, end),
    }
  }

  async findMany<S extends _SORT>(options: {
    filter: BaseCondition<_ENTITY>
    limit?: number
    sort?: NoExtra<_SORT, S>
  }): Promise<_ENTITY[]> {
    const { filter, sort, limit } = options
    let data: _ENTITY[] = []

    if (filter) {
      data = await this.collection.filter((record) => this.executeFilter(record, filter)).toArray()
    } else {
      data = await this.collection.toArray()
    }

    if (sort) {
      data = this.executeSort(data, sort)
    }

    if (limit) {
      data = data.slice(0, limit)
    }
    return data
  }

  async findManyBy(filter: BaseCondition<_ENTITY>): Promise<_ENTITY[]> {
    const data = await this.collection
      .filter((record) => {
        return this.executeFilter(record, filter)
      })
      .toArray()
    return data
  }

  async findOneBy(filter: BaseCondition<_ENTITY>): Promise<_ENTITY | null> {
    const data = await this.collection
      .filter((record) => {
        return this.executeFilter(record, filter)
      })
      .toArray()
    return data[0] || null
  }

  async deleteMany(primaryKeyList: number[]) {
    await this.collection.bulkDelete(primaryKeyList)
  }

  async deleteOne(primaryKey: number) {
    await this.collection.delete(primaryKey)
  }
}
