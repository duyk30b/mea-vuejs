import type { ProductBatch } from '../../../modules/product-batch'
import type { BaseIndexedDB } from '../_base/_base.indexed-db'
import { BaseRepository } from '../_base/_base.repository'
import { MeaDatabase } from '../database'

export class ProductRepository extends BaseRepository<ProductBatch> {
  constructor(baseDB: BaseIndexedDB) {
    super({ baseDB, storeName: 'ProductBatch' })
  }
}

export const ProductBatchDB = new ProductRepository(MeaDatabase)
