import { Batch } from '../batch'
import { Product } from '../product'
import { Receipt } from '../receipt/receipt.model'

export class ReceiptItem {
  id: number
  receiptId: number
  distributorId: number
  productId: number
  lotNumber: string // Lô sản phẩm
  expiryDate?: number
  batchId: number
  costPrice: number 
  retailPrice: number 
  wholesalePrice: number 
  quantity: number = 0
  unitRate: number

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

  get unitWholesalePrice() {
    return this.wholesalePrice * this.unitRate
  }

  get unitRetailPrice() {
    return this.retailPrice * this.unitRate
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

  set unitWholesalePrice(data: number) {
    this.wholesalePrice = data / this.unitRate
  }

  set unitRetailPrice(data: number) {
    this.retailPrice = data / this.unitRate
  }

  static init() {
    const ins = new ReceiptItem()
    ins.id = 0
    ins.quantity = 0
    ins.costPrice = 0
    ins.wholesalePrice = 0
    ins.retailPrice = 0
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
