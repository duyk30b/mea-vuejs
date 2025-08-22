import { CONFIG } from '@/config'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { IndexedDBQuery } from '../../core/indexed-db/_base/indexed-db.query'
import { BatchDB } from '../../core/indexed-db/repository/batch.repository'
import { ProductDB } from '../../core/indexed-db/repository/product.repository'
import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { ESArray, throttleAsync } from '../../utils'
import { MeService } from '../_me/me.service'
import { AuthService } from '../auth/auth.service'
import { Batch } from '../batch'
import { DiscountInteractType, DiscountService, type Discount } from '../discount'
import { Position, PositionInteractType, PositionService } from '../position'
import { ProductGroup, ProductGroupService } from '../product-group'
import { ProductApi } from './product.api'
import type {
  ProductDetailQuery,
  ProductGetQuery,
  ProductListQuery,
  ProductPaginationQuery,
} from './product.dto'
import { Product } from './product.model'

const ProductDBQuery = new IndexedDBQuery<Product>()

export class ProductService {
  static refreshDB: () => Promise<{ numberChange: number }> = throttleAsync(
    async (params) => {
      try {
        let refreshTime = await RefreshTimeDB.findOneByCode('PRODUCT')
        if (!refreshTime) {
          refreshTime = { code: 'PRODUCT', dataVersion: 0, time: new Date(0).toISOString() }
        }
        const dataVersion = MeService.organization.value.dataVersionParse?.product || 0

        let apiResponse: { time: Date; productList: Product[] }

        if (refreshTime.dataVersion !== dataVersion) {
          await ProductDB.truncate()
          apiResponse = await ProductApi.list({})
        } else {
          const lastTime = new Date(refreshTime.time)
          apiResponse = await ProductApi.list({
            filter: { updatedAt: { GTE: lastTime } },
          })
        }

        if (apiResponse.productList.length) {
          await ProductDB.upsertMany(apiResponse.productList)
          refreshTime.time = apiResponse.time.toISOString()
          refreshTime.dataVersion = dataVersion
          await RefreshTimeDB.upsertOne(refreshTime)
        }

        return { numberChange: apiResponse.productList.length }
      } catch (error: any) {
        console.log('🚀 ~ file: product.service.ts:43 ~ ProductService ~ refreshDB ~ error:', error)
        AlertStore.add({ type: 'error', message: error.message })
        if (CONFIG.MODE === 'production') {
          await AuthService.logout()
          location.reload()
        }
        return
      }
    },
    5 * 1000, // trong vòng 5s không được query
  )

  private static async executeFilter(productList: Product[], filter: ProductGetQuery['filter']) {
    if (!filter) return productList
    return productList.filter((i) => {
      return ProductDBQuery.executeFilter(i, filter)
    })
  }
  private static async executeSort(productList: Product[], sort: ProductGetQuery['sort']) {
    if (!sort) return productList
    return ProductDBQuery.executeSort(productList, sort)
  }

  static async executeRelation(productList: Product[], relation: ProductGetQuery['relation']) {
    if (!relation) return productList
    try {
      const productIdList = productList.map((i) => i.id)

      const [productGroupMap, discountAll, positionAll, batchList] = await Promise.all([
        relation?.productGroup ? ProductGroupService.getMap() : <Record<string, ProductGroup>>{},
        relation?.discountList ? DiscountService.getAll() : <Discount[]>[],
        relation?.positionList ? PositionService.getAll() : <Position[]>[],
        relation?.batchList
          ? BatchDB.findMany({
            condition: { quantity: { NOT: 0 }, productId: { IN: productIdList } },
            sort: { id: 'ASC' },
          })
          : <Batch[]>[],
      ])

      productList.forEach((product) => {
        if (relation?.productGroup) {
          product.productGroup = productGroupMap[product.productGroupId]
        }
        if (relation?.discountList) {
          product.discountList = discountAll.filter((i) => {
            return (
              i.discountInteractType === DiscountInteractType.Product &&
              i.discountInteractId === product.id
            )
          })
          product.discountListExtra = discountAll.filter((i) => {
            return (
              i.discountInteractType === DiscountInteractType.Product && i.discountInteractId === 0
            )
          })
        }
        if (relation?.positionList) {
          product.positionList = positionAll.filter((i) => {
            return (
              i.positionType === PositionInteractType.Product && i.positionInteractId === product.id
            )
          })
        }
        if (relation?.batchList) {
          const batchFilter = batchList.filter((i) => i.productId === product.id)
          product.batchList = Batch.fromList(batchFilter)
        }
      })
    } catch (error) {
      console.log('🚀 ~ product.service.ts:129 ~ ProductService ~ executeRelation ~ error:', error)
    }
    return productList
  }

  static async pagination(query: ProductPaginationQuery) {
    const page = query.page || 1
    const limit = query.limit || 10
    const productAll = await ProductDB.findAll()

    const dataFilter = await ProductService.executeFilter(productAll, query.filter)
    const dataRelation = await ProductService.executeRelation(dataFilter, query.relation)
    const dataSort = await ProductService.executeSort(dataRelation, query.sort)

    const data = dataSort.slice((page - 1) * limit, page * limit)

    const productList = Product.fromList(data)
    productList.forEach((product) => {
      product.batchList?.forEach((batch) => {
        batch.product = Product.basic(product)
      })
    })

    return {
      page,
      limit,
      total: dataFilter.length,
      productList,
    }
  }

  static async list(params: ProductListQuery) {
    const { filter, limit, sort, relation } = params
    const objects = await ProductDB.findMany({
      limit,
      condition: {
        id: filter?.id,
        isActive: filter?.isActive,
        productGroupId: filter?.productGroupId,
        quantity: filter?.quantity,
        warehouseIds: filter?.warehouseIds,
        $OR: filter?.$OR,
        $AND: filter?.$AND,
      },
      sort,
    })
    const productList = Product.fromList(objects)

    return productList
  }

  static async map(params: ProductListQuery) {
    const list = await ProductService.list(params)
    return ESArray.arrayToKeyValue(list, 'id')
  }

  static async search(text: string) {
    if (!text) text = ''
    const objects = await ProductDB.findManyBy({
      $OR: [
        { productCode: { LIKE: text } },
        { brandName: { LIKE: text } },
        { substance: { LIKE: text } },
      ],
      isActive: 1,
    })
    return Product.fromList(objects)
  }

  static async getOne(id: number) {
    const product = await ProductDB.findOneByKey(id)
    return product
  }

  static async detail(
    id: number,
    query: ProductDetailQuery,
    options?: { refetch?: boolean; query?: boolean },
  ) {
    let product: Product | undefined
    if (options?.query) {
      product = await ProductApi.detail(id, query)
      await ProductDB.upsertOne(product)
    } else {
      const productPlain = await ProductDB.findOneByKey(id)
      product = productPlain ? Product.from(productPlain) : Product.blank()
    }
    return product
  }

  static async createOne(body: {
    product: Product
    positionList?: Position[]
    discountList?: Discount[]
  }) {
    const response = await ProductApi.createOne(body)
    await ProductDB.upsertOne(response)
    PositionService.loadedAll = false
    return response
  }

  static async updateOne(
    id: number,
    body: {
      product: Product
      positionList?: Position[]
      discountList?: Discount[]
    },
  ) {
    const response = await ProductApi.updateOne(id, body)
    if (response.success) {
      await ProductDB.replaceOne(id, response.data.product)
      PositionService.loadedAll = false
    }
    return response
  }

  static async destroyOne(id: number) {
    const response = await ProductApi.destroyOne(id)
    if (response.success) {
      await ProductDB.deleteOneByKey(id)
      PositionService.loadedAll = false
    }
    return response
  }
}
