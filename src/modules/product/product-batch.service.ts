import { AxiosInstance } from '@/core/axios.instance'
import {
  ProductBatchDetailQuery,
  ProductBatchListQuery,
  ProductBatchPaginationQuery,
} from './product-batch.dto'
import { ProductBatch } from './product-batch.model'

export class ProductBatchService {
  static async pagination(options: ProductBatchPaginationQuery) {
    const params = ProductBatchPaginationQuery.plainFromPlain(options)

    const response = await AxiosInstance.get('/product-batch/pagination', { params })
    return {
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit,
      data: ProductBatch.fromPlains(response.data.data),
    }
  }

  static async list(options: ProductBatchListQuery): Promise<ProductBatch[]> {
    const params = ProductBatchListQuery.plainFromPlain(options)

    const { data } = await AxiosInstance.get('/product-batch/list', { params })
    return ProductBatch.fromPlains(data)
  }

  static async detail(id: number, options: ProductBatchDetailQuery) {
    const params = ProductBatchDetailQuery.plainFromPlain(options)

    const { data } = await AxiosInstance.get(`/product-batch/detail/${id}`, { params })
    return ProductBatch.fromPlain(data)
  }

  static async createOne(productBatch: ProductBatch) {
    const productBatchDto = ProductBatch.toPlain(productBatch, 'CREATE')
    const { data } = await AxiosInstance.post('/product-batch/create', productBatchDto)

    return ProductBatch.fromPlain(data)
  }

  static async updateOne(id: number, productBatch: ProductBatch) {
    const productBatchDto = ProductBatch.toPlain(productBatch, 'UPDATE')
    const { data } = await AxiosInstance.patch(`/product-batch/update/${id}`, productBatchDto)

    return ProductBatch.fromPlain(data)
  }

  static async deleteOne(id: number) {
    const response = await AxiosInstance.delete(`/product-batch/delete/${id}`)
    return response.data as { success: 'true' | 'false'; message?: string }
  }
}
