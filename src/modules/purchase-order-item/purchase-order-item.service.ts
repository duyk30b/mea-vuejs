import { ESArray } from '@/utils'
import { ProductService } from '../product'
import type { PurchaseOrderItem } from './purchase-order-item.model'

export class PurchaseOrderItemService {
  static async refreshRelation(data?: PurchaseOrderItem[]) {
    if (!data?.length) return

    const productIdList = data.map((i) => i.productId)
    const productList = await ProductService.list({ filter: { id: { IN: productIdList } } })
    const productMap = ESArray.arrayToKeyValue(productList, 'id')

    data.forEach((i) => (i.product = productMap[i.productId]))
  }
}
