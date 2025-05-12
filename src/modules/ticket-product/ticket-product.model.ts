import { Batch } from '../batch'
import type { Customer } from '../customer'
import { DeliveryStatus, DiscountType } from '../enum'
import { Product } from '../product'
import { TicketBatch } from '../ticket-batch'
import type { Ticket } from '../ticket/ticket.model'

export enum TicketProductType {
  Prescription = 1,
  Consumable = 2,
}
export class TicketProduct {
  id: number
  priority: number
  hasInventoryImpact: 0 | 1
  customerId: number
  ticketId: number
  warehouseId: number
  productId: number
  type: TicketProductType
  deliveryStatus: DeliveryStatus
  unitRate: number
  quantityPrescription: number
  quantity: number
  costAmount: number // không thể có costPrice, vì có thể bao gồm nhiều lô với vốn khác nhau
  expectedPrice: number
  discountMoney: number
  discountPercent: number
  discountType: DiscountType
  actualPrice: number
  hintUsage: string | null

  ticket?: Ticket
  customer?: Customer
  product?: Product | null

  ticketBatchList?: TicketBatch[]

  get unitName() {
    return this.product?.getUnitNameByRate(this.unitRate) || ''
  }

  get unitQuantity() {
    return Number((this.quantity / this.unitRate).toFixed(3))
  }

  get unitQuantityPrescription() {
    return Number((this.quantityPrescription / this.unitRate).toFixed(3))
  }

  get unitExpectedPrice() {
    return this.expectedPrice * this.unitRate
  }

  get unitDiscountMoney() {
    return this.discountMoney * this.unitRate
  }

  get unitActualPrice() {
    return this.actualPrice * this.unitRate
  }

  set unitQuantity(data: number) {
    this.quantity = data * this.unitRate
  }

  set unitQuantityPrescription(data: number) {
    this.quantityPrescription = data * this.unitRate
  }

  set unitExpectedPrice(data: number) {
    this.expectedPrice = data / this.unitRate
  }

  set unitDiscountMoney(data: number) {
    this.discountMoney = data / this.unitRate
  }

  set unitActualPrice(data: number) {
    this.actualPrice = data / this.unitRate
  }

  static init(): TicketProduct {
    const ins = new TicketProduct()
    ins.id = 0
    ins.ticketId = 0
    ins.customerId = 0
    ins.productId = 0
    ins.deliveryStatus = DeliveryStatus.Pending
    ins.quantity = 0
    ins.quantityPrescription = 0
    ins.unitRate = 1
    ins.expectedPrice = 0
    ins.discountMoney = 0
    ins.discountPercent = 0
    ins.discountType = DiscountType.Percent
    ins.actualPrice = 0
    ins.hintUsage = ''
    return ins
  }

  static blank(): TicketProduct {
    const ins = TicketProduct.init()
    ins.product = Product.init()
    ins.ticketBatchList = []
    return ins
  }

  static basic(source: TicketProduct) {
    const target = new TicketProduct()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: TicketProduct[]): TicketProduct[] {
    return sources.map((i) => TicketProduct.basic(i))
  }

  static from(source: TicketProduct) {
    const target = TicketProduct.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'product')) {
      target.product = source.product ? Product.basic(source.product) : source.product
    }
    if (source.ticketBatchList) {
      target.ticketBatchList = TicketBatch.basicList(source.ticketBatchList)
      target.ticketBatchList.forEach((i) => {
        i.batch = Batch.basic(i.batch!)
      })
    }
    return target
  }

  static fromList(sourceList: TicketProduct[]): TicketProduct[] {
    return sourceList.map((i) => TicketProduct.from(i))
  }

  static equal(a: TicketProduct, b: TicketProduct) {
    if (a.id != b.id) return false
    if (a.priority != b.priority) return false
    if (a.ticketId != b.ticketId) return false
    if (a.warehouseId != b.warehouseId) return false
    if (a.customerId != b.customerId) return false
    if (a.productId != b.productId) return false
    if (a.type != b.type) return false
    if (a.deliveryStatus != b.deliveryStatus) return false
    if (a.unitRate != b.unitRate) return false
    if (a.quantityPrescription != b.quantityPrescription) return false
    if (a.quantity != b.quantity) return false
    if (a.costAmount != b.costAmount) return false
    if (a.expectedPrice != b.expectedPrice) return false
    if (a.discountMoney != b.discountMoney) return false
    if (a.discountPercent != b.discountPercent) return false
    // if (a.discountType != b.discountType) return false
    if (a.actualPrice != b.actualPrice) return false
    if (a.hintUsage != b.hintUsage) return false
    return true
  }

  static equalList(a: TicketProduct[], b: TicketProduct[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!TicketProduct.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
