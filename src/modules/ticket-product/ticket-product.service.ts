import { ESArray } from '@/utils'
import { Batch, BatchService } from '../batch'
import { Product, ProductService } from '../product'
import { TicketProductApi } from './ticket-product.api'
import { TicketProductListQuery } from './ticket-product.dto'

export class TicketProductService {
  static async list(
    query: TicketProductListQuery,
    options?: { refresh: { product?: boolean; batch?: boolean } },
  ) {
    const ticketProductList = await TicketProductApi.list(query)

    const productIdList = ticketProductList.map((i) => i.productId)
    const batchIdList = ticketProductList.map((i) => i.batchId)

    const [productList, batchList] = await Promise.all([
      options?.refresh?.product
        ? ProductService.list({ filter: { id: { IN: productIdList } } })
        : <Product[]>[],
      options?.refresh?.batch
        ? BatchService.list({ filter: { id: { IN: batchIdList } } })
        : <Batch[]>[],
    ])
    const productMap = ESArray.arrayToKeyValue(productList, 'id')
    const batchMap = ESArray.arrayToKeyValue(batchList, 'id')

    ticketProductList.forEach((i) => {
      if (options?.refresh?.product) {
        i.product = productMap[i.productId]
      }
      if (options?.refresh?.batch) {
        i.batch = batchMap[i.batchId]
      }
    })
    return ticketProductList
  }
}
