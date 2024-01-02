import { AxiosInstance } from '@/core/axios.instance'
import { debounceAsync } from '@/utils/helpers'
import type { ApiPaginationResponse } from '../pagination'
import { ProductDetailQuery, ProductListQuery, ProductPaginationQuery } from './product.dto'
import { Product } from './product.model'

export class ProductService {
  static async pagination(options: ProductPaginationQuery) {
    const params = ProductPaginationQuery.plainFromPlain(options)

    const response = await AxiosInstance.get('/product/pagination', { params })
    const data = response.data as ApiPaginationResponse
    return {
      total: data.total,
      page: data.page,
      limit: data.limit,
      data: Product.fromPlains(data.data),
    }
  }

  static async list(options: ProductListQuery): Promise<Product[]> {
    const params = ProductListQuery.plainFromPlain(options)

    const { data } = await AxiosInstance.get('/product/list', { params })
    return Product.fromPlains(data)
  }

  static search: (options: ProductListQuery) => Promise<Product[]> = debounceAsync(
    async (options: ProductListQuery): Promise<Product[]> => {
      return ProductService.list(options)
    },
    200
  )

  static async detail(id: number, options: ProductDetailQuery = {}): Promise<Product> {
    const params = ProductDetailQuery.plainFromPlain(options)
    const { data } = await AxiosInstance.get(`/product/detail/${id}`, { params })
    return Product.fromPlain(data)
  }

  static async createOne(product: Product) {
    const productDto = Product.toPlain(product, 'CREATE')
    const { data } = await AxiosInstance.post('/product/create', productDto)

    return Product.fromPlain(data)
  }

  static async updateOne(id: number, product: Product) {
    const productDto = Product.toPlain(product, 'UPDATE')
    const { data } = await AxiosInstance.patch(`/product/update/${id}`, productDto)

    return Product.fromPlain(data)
  }

  static async deleteOne(id: number) {
    const { data } = await AxiosInstance.delete(`/product/delete/${id}`)
    return data as { success: boolean }
  }
}
