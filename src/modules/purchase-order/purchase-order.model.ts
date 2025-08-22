import { Batch } from '../batch'
import { Distributor } from '../distributor'
import { DeliveryStatus, DiscountType } from '../enum'
import { Payment } from '../payment'
import { Product } from '../product'
import { PurchaseOrderItem } from '../purchase-order-item/purchase-order-item.model'

export enum PurchaseOrderStatus {
  Schedule = 1,
  Draft = 2,
  Deposited = 3,
  Executing = 4,
  Debt = 5,
  Completed = 6,
  Cancelled = 7,
}

export class PurchaseOrder {
  id: number
  distributorId: number
  status: PurchaseOrderStatus
  deliveryStatus: DeliveryStatus
  itemsActualMoney: number // tiền sản phẩm
  discountMoney: number // tiền giảm giá
  discountPercent: number // % giảm giá
  discountType: DiscountType // Loại giảm giá
  surcharge: number // phụ phí: tiền phải trả thêm: như tiền ship, tiền vé, hao phí xăng dầu
  totalMoney: number // tổng tiền = tiền sản phẩm + phụ phí - tiền giảm giá
  paid: number
  debt: number // tiền nợ
  note: string
  startedAt: number
  shippedAt: number

  purchaseOrderItemList?: PurchaseOrderItem[]
  distributor?: Distributor
  paymentList?: Payment[]

  static init(): PurchaseOrder {
    const ins = new PurchaseOrder()
    ins.id = 0
    ins.status = PurchaseOrderStatus.Draft
    ins.itemsActualMoney = 0
    ins.discountMoney = 0
    ins.discountPercent = 0
    ins.discountType = DiscountType.Percent
    ins.surcharge = 0
    ins.totalMoney = 0
    ins.paid = 0
    ins.debt = 0

    return ins
  }

  static blank(): PurchaseOrder {
    const ins = PurchaseOrder.init()
    ins.purchaseOrderItemList = []
    ins.distributor = Distributor.init()
    ins.paymentList = []
    return ins
  }

  static basic(source: PurchaseOrder) {
    const target = new PurchaseOrder()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: PurchaseOrder[]): PurchaseOrder[] {
    return sources.map((i) => PurchaseOrder.basic(i))
  }

  static from(source: PurchaseOrder): PurchaseOrder {
    const target = PurchaseOrder.basic(source)
    Object.assign(target, source)
    if (Object.prototype.hasOwnProperty.call(source, 'distributor')) {
      if (!source.distributor) {
        target.distributor = source.distributor
      } else {
        const distributor = new Distributor()
        Object.assign(distributor, source.distributor)
        target.distributor = distributor
      }
    }
    if (source.purchaseOrderItemList) {
      target.purchaseOrderItemList = source.purchaseOrderItemList.map((i) => {
        const purchaseOrderItem = new PurchaseOrderItem()
        Object.assign(purchaseOrderItem, i)
        if (Object.prototype.hasOwnProperty.call(source, 'batch')) {
          if (!i.batch) {
            purchaseOrderItem.batch = i.batch
          } else {
            const batch = new Batch()
            Object.assign(batch, i.batch)
            purchaseOrderItem.batch = batch
          }
        }
        if (Object.prototype.hasOwnProperty.call(i, 'product')) {
          if (!i.product) {
            purchaseOrderItem.product = i.product
          } else {
            const product = new Product()
            Object.assign(product, i.product)
            purchaseOrderItem.product = product
          }
        }
        return purchaseOrderItem
      })
    }
    if (source.paymentList) {
      target.paymentList = Payment.basicList(source.paymentList)
    }
    return target
  }

  static fromList(sourceList: PurchaseOrder[]): PurchaseOrder[] {
    return sourceList.map((i) => PurchaseOrder.from(i))
  }
}
