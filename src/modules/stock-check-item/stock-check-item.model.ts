import { Batch } from '../batch'
import { Product } from '../product'
import { StockCheck } from '../stock-check/stock-check.model'

export class StockCheckItem {
  id: number
  stockCheckId: number
  productId: number
  batchId: number

  systemQuantity: number
  actualQuantity: number

  systemCostAmount: number
  actualCostAmount: number

  note: string // Ghi chú

  stockCheck?: StockCheck
  batch?: Batch
  product?: Product

  static init() {
    const ins = new StockCheckItem()
    ins.id = 0
    ins.batchId = 0
    ins.productId = 0
    ins.systemQuantity = 0
    ins.actualQuantity = 0
    ins.systemCostAmount = 0
    ins.actualCostAmount = 0
    ins.note = ''
    return ins
  }

  static blank() {
    const ins = StockCheckItem.init()
    ins.batch = Batch.init()
    ins.product = Product.init()
    ins.stockCheck = StockCheck.init()
    return ins
  }

  static from(source: StockCheckItem): StockCheckItem {
    const target = new StockCheckItem()
    Object.assign(target, source)
    if (Object.prototype.hasOwnProperty.call(source, 'stockCheck')) {
      if (!source.stockCheck) {
        target.stockCheck = source.stockCheck
      } else {
        const stockCheck = new StockCheck()
        Object.assign(stockCheck, source.stockCheck)
        target.stockCheck = stockCheck
      }
    }
    if (Object.prototype.hasOwnProperty.call(source, 'batch')) {
      if (!source.batch) {
        target.batch = source.batch
      } else {
        const batch = new Batch()
        Object.assign(batch, source.batch)
        target.batch = batch
      }
    }
    if (Object.prototype.hasOwnProperty.call(source, 'product')) {
      if (!source.product) {
        target.product = source.product
      } else {
        const product = new Product()
        Object.assign(product, source.product)
        target.product = product
      }
    }
    return target
  }

  static fromList(sourceList: StockCheckItem[]): StockCheckItem[] {
    return sourceList.map((i) => StockCheckItem.from(i))
  }
}
