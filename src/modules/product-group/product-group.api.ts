import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
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
    const { data, meta } = response.data as FullResponse
    return {
      productGroupList: ProductGroup.fromList(data.productGroupList),
      total: data.total,
      page: data.page,
      limit: data.limit,
    }
  }

  static async list(options: ProductGroupListQuery) {
    const params = ProductGroupGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/product-group/list', { params })
    const { data, time } = response.data as FullResponse
    return {
      time: new Date(time),
      data: ProductGroup.fromList(data),
    }
  }

  static async detail(id: number, options: ProductGroupDetailQuery = {}): Promise<ProductGroup> {
    const params = ProductGroupGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/product-group/detail/${id}`, { params })
    const { data, meta } = response.data as FullResponse
    return ProductGroup.from(data)
  }

  static async replaceAll(body: ProductGroup[]) {
    const response = await AxiosInstance.post('/product-group/replace-all', {
      productGroupReplaceAll: body.map((i) => {
        return {
          id: i.id || 0,
          name: i.name,
        }
      }),
    })
    const { data } = response.data as FullResponse
    return data
  }

  static async createOne(productGroup: ProductGroup) {
    const response = await AxiosInstance.post('/product-group/create', {
      name: productGroup.name,
    })
    const { data } = response.data as FullResponse
    return ProductGroup.from(data)
  }

  static async updateOne(id: number, productGroup: ProductGroup) {
    const response = await AxiosInstance.post(`/product-group/update/${id}`, {
      name: productGroup.name,
    })
    const { data } = response.data as FullResponse
    return ProductGroup.from(data)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.post(`/product-group/destroy/${id}`)
    const { data, meta } = response.data as FullResponse
    return ProductGroup.from(data)
  }
}
