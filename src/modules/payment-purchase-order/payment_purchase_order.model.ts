import { Payment } from '../payment/payment.model'
import { PurchaseOrder } from '../purchase-order'
import type { PurchaseOrderActionType } from '../purchase-order/purchase-order.type'

export class PaymentPurchaseOrder {
  id: string
  paymentId: string
  purchaseOrderId: string
  purchaseOrderActionType: PurchaseOrderActionType

  paidMoney: number
  debtMoney: number

  createdAt: number

  payment: Payment
  purchaseOrder: PurchaseOrder

  static init(): PaymentPurchaseOrder {
    const ins = new PaymentPurchaseOrder()
    ins.id = ''
    ins.paymentId = ''
    ins.purchaseOrderId = ''

    ins.paidMoney = 0
    ins.debtMoney = 0
    return ins
  }

  static blank(): PaymentPurchaseOrder {
    const ins = PaymentPurchaseOrder.init()
    return ins
  }

  static basic(source: PaymentPurchaseOrder) {
    const target = new PaymentPurchaseOrder()
    Object.keys(source).forEach((key: any) => {
      const value = source[key as keyof typeof source]
      if (value !== undefined) {
        ; (target as any)[key] = value
      }
    })
    return target
  }

  static basicList(sources: PaymentPurchaseOrder[]): PaymentPurchaseOrder[] {
    return sources.map((i) => PaymentPurchaseOrder.basic(i))
  }

  static from(source: PaymentPurchaseOrder) {
    const target = PaymentPurchaseOrder.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'payment')) {
      target.payment = source.payment ? Payment.basic(source.payment) : source.payment
    }
    if (Object.prototype.hasOwnProperty.call(source, 'purchaseOrder')) {
      target.purchaseOrder = source.purchaseOrder
        ? PurchaseOrder.basic(source.purchaseOrder)
        : source.purchaseOrder
    }


    return target
  }

  static fromList(roots: PaymentPurchaseOrder[]) {
    return roots.map((i) => PaymentPurchaseOrder.from(i))
  }
}
