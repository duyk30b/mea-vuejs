import type { Product, ProductPaginationQuery } from '../../../modules/product'
import { customFilter } from '../../../utils'
import type { BaseIndexedDB } from '../_base/_base.indexed-db'
import { BaseRepository } from '../_base/_base.repository'
import { MeaDatabase } from '../database'

export class ProductRepository extends BaseRepository<Product> {
  constructor(baseDB: BaseIndexedDB) {
    super({ baseDB, storeName: 'Product' })
  }

  async search(text: string): Promise<Product[]> {
    const productList = await this.getManyBy({})
    return productList.filter((item) => {
      if (!item.isActive) return false
      if (!customFilter(item.brandName, text, 2) && !customFilter(item.substance || '', text, 2)) {
        return false
      }
      return true
    })
  }
}

export const ProductDB = new ProductRepository(MeaDatabase)
