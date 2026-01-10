import type { Dexie, Table } from 'dexie'
import { DexieDB } from './_dexie.schema'
import type { BaseCondition } from '../_base/indexed-db.query'

export class BaseRepository<_ENTITY> {
  private db: Table<_ENTITY, number, _ENTITY>
  constructor(entity: _ENTITY) {
    const entityName = (entity as any).name
    this.db = DexieDB[entityName as keyof Dexie] as any
  }



  async upsertOne(data: _ENTITY) {
    await this.db.put(data)
  }
  async upsertMany(data: _ENTITY[]) {
    await this.db.bulkPut(data)
  }

    async findMany<S extends _SORT>(options: {
      condition: BaseCondition<_ENTITY>
      limit?: number
      sort?: NoExtra<_SORT, S>
    }): Promise<_ENTITY[]> {}
}
