import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  ProductGroupDetailQuery,
  ProductGroupGetQuery,
  type ProductGroupListQuery,
  type ProductGroupPaginationQuery,
} from './product-group.dto'
import { ProductGroup } from './product-group.model'

export class ProductGroupApi {
  static async pagination(options: ProductGroupPaginationQuery) {
    const params = ProductGroupGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/product-group/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: ProductGroup.fromList(data),
    }
  }

  static async list(options: ProductGroupListQuery) {
    const params = ProductGroupGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/product-group/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: ProductGroup.fromList(data),
    }
  }

  static async detail(id: number, options: ProductGroupDetailQuery = {}): Promise<ProductGroup> {
    const params = ProductGroupGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/product-group/detail/${id}`, { params })
    const { data, meta } = response.data as BaseResponse
    return ProductGroup.from(data)
  }

  static async createOne(customerSource: ProductGroup) {
    const response = await AxiosInstance.post('/product-group/create', {
      name: customerSource.name,
    })
    const { data } = response.data as BaseResponse
    return ProductGroup.from(data)
  }

  static async updateOne(id: number, customerSource: ProductGroup) {
    const response = await AxiosInstance.patch(`/product-group/update/${id}`, {
      name: customerSource.name,
    })
    const { data } = response.data as BaseResponse
    return ProductGroup.from(data)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.delete(`/product-group/destroy/${id}`)
    const { data, meta } = response.data as BaseResponse
    return ProductGroup.from(data)
  }
}
