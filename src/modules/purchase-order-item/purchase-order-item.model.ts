import { PurchaseOrder } from '@/modules/purchase-order'
import { BaseModel } from '../_base/base.model'
import { Batch } from '../batch'
import { Product } from '../product'
import { DeliveryStatus } from '../enum'

export class PurchaseOrderItem extends BaseModel {
  id: string
  purchaseOrderId: string
  distributorId: number
  warehouseId: number
  productId: number
  batchId: number

  lotNumber: string // Lô sản phẩm
  expiryDate?: number
  unitRate: number

  unitCostPrice: number
  unitListPrice: number // Giá niêm yết
  quantity: number
  quantityCompleted: number

  purchaseOrder?: PurchaseOrder
  batch?: Batch
  product?: Product

  get unitName() {
    return this.product!.getUnitNameByRate(this.unitRate)
  }

  get unitQuantityFix() {
    return Math.round((this.quantity / this.unitRate) * 1000) / 1000
  }

  set unitQuantityFix(unitQuantity: number) {
    this.quantity = Math.round(unitQuantity * this.unitRate * 1000) / 1000
  }

  get costPriceFix() {
    return Math.round(this.unitCostPrice / this.unitRate)
  }

  get listPriceFix() {
    return Math.round(this.unitListPrice / this.unitRate)
  }

  get deliveryStatusFix() {
    if (this.quantity === 0 && this.quantityCompleted === 0) return DeliveryStatus.Empty
    if (this.quantityCompleted === 0 && this.quantityCompleted < this.quantity)
      return DeliveryStatus.Pending
    if (this.quantity > 0 && this.quantityCompleted < this.quantity) return DeliveryStatus.Partial
    if (this.quantity === this.quantityCompleted) return DeliveryStatus.Delivered
    else return DeliveryStatus.Cancelled
  }

  public changeUnitRate(unitRate: number) {
    const oldUnitRate = this.unitRate
    this.unitCostPrice = Math.round((this.unitCostPrice * unitRate) / oldUnitRate)
    this.unitListPrice = Math.round((this.unitListPrice * unitRate) / oldUnitRate)
    this.unitRate = unitRate
  }

  static init() {
    const ins = new PurchaseOrderItem()
    ins._localId = Math.random().toString(36).substring(2)

    ins.id = ''
    ins.batchId = 0
    ins.productId = 0
    ins.distributorId = 0
    ins.warehouseId = 0

    ins.quantity = 0
    ins.unitCostPrice = 0
    ins.unitListPrice = 0
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
    target._localId = String(
      source.id || source._localId || Math.random().toString(36).substring(2),
    )
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
