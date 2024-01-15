import type { Product } from '../../../modules/product'
import type { BaseIndexedDB } from '../_base/_base.indexed-db'
import { BaseRepository } from '../_base/_base.repository'
import { MeaDatabase } from '../database'

export class ProductRepository extends BaseRepository<Product> {
  constructor(baseDB: BaseIndexedDB) {
    super({ baseDB, storeName: 'Product' })
  }
}

export const ProductDB = new ProductRepository(MeaDatabase)
