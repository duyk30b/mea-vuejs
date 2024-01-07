import type {
  ProductBatch,
  ProductBatchPaginationQuery,
  ProductPaginationQuery,
} from '../../modules/product'
import { customFilter, objectGroupByArray, objectKeyByArray } from '../../utils'
import { ProductBatchDB } from './repository/product-batch.repository copy'
import { ProductDB } from './repository/product.repository'

export class MixedRepository {
  static async paginationProduct(params: ProductPaginationQuery) {
    const { filter, sort } = params
    const page = params.page || 1
    const limit = params.limit || 10

    const { total, data } = await ProductDB.pagination({
      condition: [
        {
          deletedAt: { IS_NULL: true },
          isActive: filter?.isActive,
          group: filter?.group,
          brandName: { LIKE: filter?.searchText },
        },
        {
          deletedAt: { IS_NULL: true },
          isActive: filter?.isActive,
          group: filter?.group,
          substance: { LIKE: filter?.searchText },
        },
      ],
      sort,
      page,
      limit,
    })

    const productIds = data.map((i) => i.id)
    const productBatchList = await ProductBatchDB.findManyBy({
      productId: { IN: productIds },
      isActive: 1,
      deletedAt: { IS_NULL: true },
    })
    const productBatchGroup = objectGroupByArray(productBatchList, 'productId')
    data.forEach((product) => {
      product.productBatches = productBatchGroup[product.id]
    })

    return {
      total,
      page: params.page,
      limit: params.limit,
      data,
    }
  }

  static async paginationProductBatch(params: ProductBatchPaginationQuery) {
    const { filter, sort } = params
    const page = params.page || 1
    const limit = params.limit || 10

    const productList = await ProductDB.getManyBy([
      {
        deletedAt: { IS_NULL: true },
        isActive: filter?.product?.isActive,
        group: filter?.product?.group,
        brandName: { LIKE: filter?.product?.searchText },
      },
      {
        deletedAt: { IS_NULL: true },
        isActive: filter?.product?.isActive,
        group: filter?.product?.group,
        substance: { LIKE: filter?.product?.searchText },
      },
    ])
    const productMap = objectKeyByArray(productList, 'id')
    const productIds = productList.map((i) => i.id)

    const productBatchList = await ProductBatchDB.getManyBy({
      deletedAt: { IS_NULL: true },
      productId: { IN: productIds },
      isActive: filter?.product?.isActive,
    })

    productBatchList.forEach((batch) => {
      batch.product = productMap[batch.productId]
    })

    productBatchList.sort((a, b) => {
      if (sort?.expiryDate) {
        if (sort?.expiryDate === 'ASC') return (a.expiryDate || 0) < (b.expiryDate || 0) ? -1 : 1
        if (sort?.expiryDate === 'DESC') return (a.expiryDate || 0) > (b.expiryDate || 0) ? -1 : 1
      }
      return a.id > b.id ? -1 : 1
    })

    const start = (page - 1) * limit
    const end = page * limit
    return {
      total: productBatchList.length,
      page: params.page,
      limit: params.limit,
      data: productBatchList.slice(start, end),
    }
  }
}
