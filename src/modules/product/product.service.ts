import { ProductDB } from '../../core/indexed-db/repository/product.repository'
import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { useMeStore } from '../_me/me.store'
import { ProductApi } from './product.api'
import type { ProductListQuery } from './product.dto'
import { Product } from './product.model'

export class ProductService {
  private static async refreshDB() {
    let refreshTime = await RefreshTimeDB.findOneByCode('PRODUCT')
    if (!refreshTime) {
      refreshTime = { code: 'PRODUCT', dataVersion: 0, time: new Date(0).toISOString() }
    }
    const dataVersion = useMeStore().organization.dataVersion

    let apiResponse: { time: Date; data: Product[] }
    let hasChange = false

    if (refreshTime.dataVersion !== dataVersion) {
      hasChange = true
      await ProductDB.truncate()
      apiResponse = await ProductApi.list({})
    } else {
      const lastTime = new Date(refreshTime.time)
      apiResponse = await ProductApi.list({
        filter: { updatedAt: { GTE: lastTime } },
      })
    }

    if (apiResponse.data.length) {
      await ProductDB.upsertMany(apiResponse.data)
    }
    refreshTime.time = apiResponse.time.toISOString()
    refreshTime.dataVersion = dataVersion
    await RefreshTimeDB.upsertOne(refreshTime)

    return {
      hasChange: hasChange || !!apiResponse.data.length,
    }
  }

  static async list(params: ProductListQuery) {
    await ProductService.refreshDB()
    const { filter, limit, sort } = params
    const objects = await ProductDB.findMany({
      limit,
      condition: {
        id: filter?.id,
        isActive: filter?.isActive,
        productGroupId: filter?.productGroupId,
        quantity: filter?.quantity,
      },
      sort,
    })
    return Product.fromList(objects)
  }

  static async search(text: string) {
    if (!text) text = ''
    const objects = await ProductDB.findManyBy({
      $OR: [{ brandName: { LIKE: text } }, { substance: { LIKE: text } }],
      isActive: 1,
      deletedAt: { IS_NULL: true },
    })
    return Product.fromList(objects)
  }
}
