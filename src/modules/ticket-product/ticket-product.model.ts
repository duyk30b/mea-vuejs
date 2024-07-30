import { Batch } from '../batch'
import type { Customer } from '../customer'
import { DeliveryStatus, DiscountType } from '../enum'
import { Product } from '../product'
import type { Ticket } from '../ticket/ticket.model'

export enum TicketProductType {
  Prescription = 1,
  Consumable = 2,
}
export class TicketProduct {
  id: number
  ticketId: number
  customerId: number
  productId: number
  batchId: number
  type: TicketProductType
  deliveryStatus: DeliveryStatus
  unitRate: number
  quantityPrescription: number
  quantity: number
  quantityReturn: number
  costAmount: number // Tổng giá cost
  expectedPrice: number // Giá dự kiến
  discountMoney: number // tiền giảm giá
  discountPercent: number // % giảm giá
  discountType: DiscountType // Loại giảm giá
  actualPrice: number // Giá thực tế
  hintUsage: string | null // Hướng dẫn sử dụng

  ticket?: Ticket
  customer?: Customer
  product?: Product | null
  batch?: Batch | null

  get unitName() {
    return this.product?.getUnitNameByRate(this.unitRate) || ''
  }

  get unitQuantity() {
    return Number((this.quantity / this.unitRate).toFixed(3))
  }

  get unitQuantityPrescription() {
    return Number((this.quantityPrescription / this.unitRate).toFixed(3))
  }

  get unitQuantityReturn() {
    return Number((this.quantityReturn / this.unitRate).toFixed(3))
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

  get lotNumber() {
    return this.batch?.lotNumber || this.product?.lotNumber
  }

  get expiryDate() {
    return this.batch?.expiryDate || this.product?.expiryDate
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
    ins.batchId = 0
    ins.deliveryStatus = DeliveryStatus.Pending
    ins.quantity = 0
    ins.quantityPrescription = 0
    ins.quantityReturn = 0
    ins.costAmount = 0
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
    ins.batch = Batch.init()
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
    return target
  }

  static fromList(sourceList: TicketProduct[]): TicketProduct[] {
    return sourceList.map((i) => TicketProduct.from(i))
  }

  static equal(a: TicketProduct, b: TicketProduct) {
    if (a.id != b.id) return false
    if (a.ticketId != b.ticketId) return false
    if (a.customerId != b.customerId) return false
    if (a.productId != b.productId) return false
    if (a.batchId != b.batchId) return false
    if (a.deliveryStatus != b.deliveryStatus) return false
    if (a.unitRate != b.unitRate) return false
    if (a.quantityPrescription != b.quantityPrescription) return false
    if (a.quantity != b.quantity) return false
    if (a.quantityReturn != b.quantityReturn) return false
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
