import { Batch } from '../batch'
import { Distributor } from '../distributor'
import { DistributorPayment } from '../distributor-payment/distributor-payment.model'
import { DiscountType } from '../enum'
import { Product } from '../product'
import { ReceiptItem } from '../receipt-item/receipt-item.model'

export enum ReceiptStatus {
  Cancelled = -1,
  Draft = 0,
  Prepayment = 1, // Chờ gửi hàng
  Debt = 2,
  Success = 3,
}

export class Receipt {
  id: number
  distributorId: number
  status: ReceiptStatus
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

  receiptItems?: ReceiptItem[]
  distributor?: Distributor
  distributorPayments?: DistributorPayment[]

  static init(): Receipt {
    const ins = new Receipt()
    ins.id = 0
    ins.status = ReceiptStatus.Draft
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

  static blank(): Receipt {
    const ins = Receipt.init()
    ins.receiptItems = []
    ins.distributor = Distributor.init()
    ins.distributorPayments = []
    return ins
  }

  static basic(source: Receipt) {
    const target = new Receipt()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Receipt[]): Receipt[] {
    return sources.map((i) => Receipt.basic(i))
  }

  static from(source: Receipt): Receipt {
    const target = Receipt.basic(source)
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
    if (source.receiptItems) {
      target.receiptItems = source.receiptItems.map((i) => {
        const receiptItem = new ReceiptItem()
        Object.assign(receiptItem, i)
        if (Object.prototype.hasOwnProperty.call(source, 'batch')) {
          if (!i.batch) {
            receiptItem.batch = i.batch
          } else {
            const batch = new Batch()
            Object.assign(batch, i.batch)
            receiptItem.batch = batch
          }
        }
        if (Object.prototype.hasOwnProperty.call(i, 'product')) {
          if (!i.product) {
            receiptItem.product = i.product
          } else {
            const product = new Product()
            Object.assign(product, i.product)
            receiptItem.product = product
          }
        }
        return receiptItem
      })
    }
    if (source.distributorPayments) {
      target.distributorPayments = source.distributorPayments.map((i) => {
        const distributorPayment = new DistributorPayment()
        Object.assign(distributorPayment, i)
        return distributorPayment
      })
    }
    return target
  }

  static fromList(sourceList: Receipt[]): Receipt[] {
    return sourceList.map((i) => Receipt.from(i))
  }
}
