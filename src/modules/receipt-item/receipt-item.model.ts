import { Batch } from '../batch'
import { Product } from '../product'
import { Receipt } from '@/modules/receipt'

export class ReceiptItem {
  id: number
  receiptId: number
  distributorId: number
  warehouseId: number
  productId: number
  batchId: number

  lotNumber: string // Lô sản phẩm
  expiryDate?: number

  quantity: number = 0
  unitRate: number
  costPrice: number
  listPrice: number // Giá niêm yết

  receipt?: Receipt
  batch?: Batch
  product?: Product

  get unitName() {
    return this.product!.getUnitNameByRate(this.unitRate)
  }

  get unitQuantity() {
    return Number((this.quantity / this.unitRate).toFixed(3))
  }

  get unitCostPrice() {
    return this.costPrice * this.unitRate
  }

  get unitListPrice() {
    return this.listPrice * this.unitRate
  }

  set unitQuantity(data: number) {
    this.quantity = data * this.unitRate
  }

  get amount() {
    return this.costPrice * this.quantity
  }

  set unitCostPrice(data: number) {
    this.costPrice = data / this.unitRate
  }

  set unitListPrice(data: number) {
    this.listPrice = data / this.unitRate
  }

  static init() {
    const ins = new ReceiptItem()
    ins.id = 0
    ins.batchId = 0
    ins.productId = 0
    ins.distributorId = 0
    ins.warehouseId = 0

    ins.quantity = 0
    ins.costPrice = 0
    ins.listPrice = 0
    ins.unitRate = 1
    return ins
  }

  static blank() {
    const ins = ReceiptItem.init()
    ins.batch = Batch.init()
    ins.product = Product.init()
    ins.receipt = Receipt.init()
    return ins
  }

  static from(source: ReceiptItem): ReceiptItem {
    const target = new ReceiptItem()
    Object.assign(target, source)
    if (Object.prototype.hasOwnProperty.call(source, 'receipt')) {
      if (!source.receipt) {
        target.receipt = source.receipt
      } else {
        const receipt = new Receipt()
        Object.assign(receipt, source.receipt)
        target.receipt = receipt
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

  static fromList(sourceList: ReceiptItem[]): ReceiptItem[] {
    return sourceList.map((i) => ReceiptItem.from(i))
  }
}
