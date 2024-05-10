import type { Batch } from '../../../modules/batch'
import type { BaseIndexedDB } from '../_base/_base.indexed-db'
import { BaseRepository } from '../_base/_base.repository'
import { MeaDatabase } from '../database'

export class ProductRepository extends BaseRepository<Batch> {
  constructor(baseDB: BaseIndexedDB) {
    super({ baseDB, storeName: 'Batch' })
  }
}

export const BatchDB = new ProductRepository(MeaDatabase)
