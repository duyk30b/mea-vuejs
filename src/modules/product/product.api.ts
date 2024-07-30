import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
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
      substance: product.substance,
      lotNumber: product.lotNumber || '',
      expiryDate: product.expiryDate,
      costPrice: product.costPrice,
      wholesalePrice: product.wholesalePrice,
      retailPrice: product.retailPrice,
      productGroupId: product.productGroupId,
      unit: product.unit,
      route: product.route,
      source: product.source,
      image: product.image,
      hintUsage: product.hintUsage,
      hasManageQuantity: product.hasManageQuantity,
      hasManageBatches: product.hasManageBatches,
      isActive: product.isActive,
    })
    const { data } = response.data as BaseResponse<{ product: any }>
    return Product.from(data.product)
  }

  static async updateOne(id: number, product: Product) {
    const response = await AxiosInstance.patch(`/product/update/${id}`, {
      brandName: product.brandName,
      substance: product.substance,
      lotNumber: product.lotNumber || '',
      expiryDate: product.expiryDate,
      costPrice: product.costPrice,
      wholesalePrice: product.wholesalePrice,
      retailPrice: product.retailPrice,
      productGroupId: product.productGroupId,
      unit: product.unit,
      route: product.route,
      source: product.source,
      image: product.image,
      hintUsage: product.hintUsage,
      hasManageQuantity: product.hasManageQuantity,
      hasManageBatches: product.hasManageBatches,
      isActive: product.isActive,
    })
    const { data } = response.data as BaseResponse<{ product: any }>
    return Product.from(data.product)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.delete(`/product/destroy/${id}`)
    const result = response.data as BaseResponse<{
      productId: number
      countTicketProduct: number
      countReceiptItem: number
    }>
    return result
  }

  static async deleteOne(id: number) {
    const response = await AxiosInstance.delete(`/product/delete/${id}`)
    const { data } = response.data as BaseResponse<{ product: any }>
    return Product.from(data.product)
  }

  static async downloadExcelProductList() {
    const response = await AxiosInstance.get(`/product/download-excel`)
    const { data } = response.data as BaseResponse<{
      buffer: { type: 'Buffer'; data: any[] }
      mimeType: string
      filename: string
    }>
    const uint8Array = new Uint8Array(data.buffer.data)
    const blob = new Blob([uint8Array], {
      type: data.mimeType,
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = data.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }
}
