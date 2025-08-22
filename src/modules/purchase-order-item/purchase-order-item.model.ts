import { PurchaseOrder } from '@/modules/purchase-order'
import { BaseModel } from '../_base/base.model'
import { Batch } from '../batch'
import { Product } from '../product'

export class PurchaseOrderItem extends BaseModel {
  id: number
  purchaseOrderId: number
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

  purchaseOrder?: PurchaseOrder
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
    const ins = new PurchaseOrderItem()
    ins._localId = Math.random()

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
    const ins = PurchaseOrderItem.init()
    ins.batch = Batch.init()
    ins.product = Product.init()
    ins.purchaseOrder = PurchaseOrder.init()
    return ins
  }

  static basic(source: PurchaseOrderItem) {
    const target = new PurchaseOrderItem()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    target._localId = source.id || source._localId || Math.random()
    return target
  }

  static basicList(sources: PurchaseOrderItem[]): PurchaseOrderItem[] {
    return sources.map((i) => PurchaseOrderItem.basic(i))
  }

  static from(source: PurchaseOrderItem): PurchaseOrderItem {
    const target = PurchaseOrderItem.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'purchaseOrder')) {
      if (!source.purchaseOrder) {
        target.purchaseOrder = source.purchaseOrder
      } else {
        const purchaseOrder = new PurchaseOrder()
        Object.assign(purchaseOrder, source.purchaseOrder)
        target.purchaseOrder = purchaseOrder
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

  static fromList(sourceList: PurchaseOrderItem[]): PurchaseOrderItem[] {
    return sourceList.map((i) => PurchaseOrderItem.from(i))
  }
}
