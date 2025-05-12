import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Batch } from '../batch'
import { ReceiptItem } from '../receipt-item'
import { TicketProduct } from '../ticket-product'
import {
  ProductDetailQuery,
  ProductGetQuery,
  ProductListQuery,
  ProductPaginationQuery,
} from './product.dto'
import { Product } from './product.model'

export class ProductApi {
  static async pagination(options: ProductPaginationQuery) {
    const params = ProductGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/product/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: Product.fromList(data),
    }
  }

  static async list(options: ProductListQuery) {
    const params = ProductGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/product/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: Product.fromList(data),
    }
  }

  // static search: (options: ProductListQuery) => Promise<Product[]> = debounceAsync(
  //   async (options: ProductListQuery): Promise<Product[]> => {
  //     return ProductApi.list(options)
  //   },
  //   200
  // )

  static async detail(id: number, options: ProductDetailQuery = {}): Promise<Product> {
    const params = ProductGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/product/detail/${id}`, { params })
    const { data } = response.data as BaseResponse<{ product: any }>
    return Product.from(data.product)
  }

  static async createOne(product: Product) {
    const response = await AxiosInstance.post('/product/create', {
      brandName: product.brandName,
      productCode: product.productCode || '',
      quantity: product.quantity,
      substance: product.substance,
      costPrice: product.costPrice,
      wholesalePrice: product.wholesalePrice,
      retailPrice: product.retailPrice,
      productGroupId: product.productGroupId || 0,
      unit: product.unit,
      route: product.route,
      source: product.source,
      image: product.image,
      hintUsage: product.hintUsage,
      warehouseIds: product.warehouseIds,
      isActive: product.isActive,

      pickupStrategy: product.pickupStrategy,
      splitBatchByWarehouse: product.splitBatchByWarehouse,
      splitBatchByDistributor: product.splitBatchByDistributor,
      splitBatchByExpiryDate: product.splitBatchByExpiryDate,
      splitBatchByCostPrice: product.splitBatchByCostPrice,

      commissionList: (product.commissionList || [])
        .filter((i) => !!i.roleId)
        .map((i) => {
          return {
            roleId: i.roleId,
            commissionValue: i.commissionValue,
            commissionCalculatorType: i.commissionCalculatorType,
          }
        }),
    })
    const { data } = response.data as BaseResponse<{ product: any }>
    return Product.from(data.product)
  }

  static async updateOne(id: number, product: Product) {
    const response = await AxiosInstance.patch(`/product/update/${id}`, {
      brandName: product.brandName,
      productCode: product.productCode,
      substance: product.substance,
      costPrice: product.costPrice,
      wholesalePrice: product.wholesalePrice,
      retailPrice: product.retailPrice,
      productGroupId: product.productGroupId || 0,
      unit: product.unit,
      route: product.route,
      source: product.source,
      image: product.image,
      hintUsage: product.hintUsage,
      warehouseIds: product.warehouseIds,
      isActive: product.isActive,

      pickupStrategy: product.pickupStrategy,
      splitBatchByWarehouse: product.splitBatchByWarehouse,
      splitBatchByDistributor: product.splitBatchByDistributor,
      splitBatchByExpiryDate: product.splitBatchByExpiryDate,
      splitBatchByCostPrice: product.splitBatchByCostPrice,

      commissionList: (product.commissionList || [])
        .filter((i) => !!i.roleId)
        .map((i) => {
          return {
            roleId: i.roleId,
            commissionValue: i.commissionValue,
            commissionCalculatorType: i.commissionCalculatorType,
          }
        }),
    })
    const result = response.data as BaseResponse<{ product: any; batchError: any[] }>
    if (result.success) {
      result.data.product = Product.from(result.data.product)
    } else {
      result.data.batchError = Batch.fromList(result.data.batchError)
    }
    return result as BaseResponse<{ product: Product; batchError: Batch[] }>
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.delete(`/product/destroy/${id}`)
    const result = response.data as BaseResponse<{
      productId: number
      receiptItemList: ReceiptItem[]
      ticketProductList: TicketProduct[]
    }>
    result.data.receiptItemList = ReceiptItem.fromList(result.data.receiptItemList)
    result.data.ticketProductList = TicketProduct.fromList(result.data.ticketProductList)
    return result
  }

  static async mergeProduct(options: { productIdSourceList: number[]; productIdTarget: number }) {
    const response = await AxiosInstance.patch(`/product/merge-product`, {
      productIdSourceList: options.productIdSourceList,
      productIdTarget: options.productIdTarget,
    })
    const { data } = response.data as BaseResponse<boolean>
    return data
  }
}
