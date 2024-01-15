import { AxiosInstance } from '../../core/axios.instance'
import {
  ProductBatchDetailQuery,
  ProductBatchGetQuery,
  ProductBatchListQuery,
  ProductBatchPaginationQuery,
} from './product-batch.dto'
import { ProductBatch } from './product-batch.model'

export class ProductBatchApi {
  static async pagination(options: ProductBatchPaginationQuery) {
    const params = ProductBatchGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/product-batch/pagination', { params })
    return {
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit,
      data: ProductBatch.fromPlains(response.data.data),
    }
  }

  static async list(options: ProductBatchListQuery): Promise<ProductBatch[]> {
    const params = ProductBatchGetQuery.toQuery(options)

    const { data } = await AxiosInstance.get('/product-batch/list', { params })
    return ProductBatch.fromPlains(data)
  }

  static async detail(id: number, options: ProductBatchDetailQuery) {
    const params = ProductBatchGetQuery.toQuery(options)

    const { data } = await AxiosInstance.get(`/product-batch/detail/${id}`, { params })
    return ProductBatch.fromPlain(data)
  }

  static async createOne(instance: ProductBatch) {
    const plain = ProductBatch.toPlain(instance, 'CREATE')
    const { data } = await AxiosInstance.post('/product-batch/create', plain)

    return ProductBatch.fromPlain(data)
  }

  static async updateOne(id: number, instance: ProductBatch) {
    const plain = ProductBatch.toPlain(instance, 'UPDATE')
    const { data } = await AxiosInstance.patch(`/product-batch/update/${id}`, plain)

    return ProductBatch.fromPlain(data)
  }

  static async deleteOne(id: number) {
    const { data } = await AxiosInstance.delete(`/product-batch/delete/${id}`)

    return ProductBatch.fromPlain(data)
  }
}
