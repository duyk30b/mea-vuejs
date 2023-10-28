import { AxiosInstance } from '../../core/axios.instance'
import { debounceAsync } from '../../utils/helpers'
import type { BaseResponse } from '../_base/base-dto'
import { USER_CREATE, USER_UPDATE } from '../_base/base-expose'
import type { ApiPaginationResponse } from '../pagination'
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
      data: Product.fromPlains(data),
    }
  }

  static async list(options: ProductListQuery) {
    const params = ProductGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/product/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: Product.fromPlains(data),
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
    const { data } = response.data as BaseResponse
    return Product.fromPlain(data)
  }

  static async createOne(instance: Product) {
    const plain = Product.toPlain(instance, USER_CREATE)
    const response = await AxiosInstance.post('/product/create', plain)
    const { data } = response.data as BaseResponse
    return Product.fromPlain(data)
  }

  static async updateOne(id: number, instance: Product) {
    const plain = Product.toPlain(instance, USER_UPDATE)
    const response = await AxiosInstance.patch(`/product/update/${id}`, plain)
    const { data } = response.data as BaseResponse
    return Product.fromPlain(data)
  }

  static async deleteOne(id: number) {
    const response = await AxiosInstance.delete(`/product/delete/${id}`)
    const { data } = response.data as BaseResponse
    return Product.fromPlain(data)
  }
}
