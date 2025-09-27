import { ESArray } from '@/utils'
import { Batch } from '../batch'
import type { Customer } from '../customer'
import {
  DeliveryStatus,
  DiscountType,
  PaymentEffect,
  PaymentMoneyStatus,
  PickupStrategy,
} from '../enum'
import { Product } from '../product'
import { TicketBatch } from '../ticket-batch'
import type { Ticket } from '../ticket/ticket.model'

export enum TicketProductType {
  Prescription = 1,
  Consumable = 2,
  Procedure = 3,
}
export class TicketProduct {
  id: string
  priority: number
  ticketId: string
  customerId: number
  productId: number
  batchId: number
  warehouseIds: string
  ticketProcedureId: string

  type: TicketProductType
  pickupStrategy: PickupStrategy
  deliveryStatus: DeliveryStatus
  paymentMoneyStatus: PaymentMoneyStatus
  paymentEffect: PaymentEffect

  quantity: number
  quantityPrescription: number
  printPrescription: number
  unitRate: number
  costAmount: number // không thể có costPrice, vì có thể bao gồm nhiều lô với vốn khác nhau
  expectedPrice: number
  discountMoney: number
  discountPercent: number
  discountType: DiscountType
  actualPrice: number

  createdAt: number
  hintUsage: string | null

  ticket?: Ticket
  customer?: Customer
  product?: Product | null
  batch?: Batch | null

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
    ins.id = ''
    ins.priority = 0
    ins.ticketId = ''
    ins.customerId = 0
    ins.productId = 0
    ins.batchId = 0
    ins.warehouseIds = JSON.stringify([0])
    ins.ticketProcedureId = ''

    ins.type = TicketProductType.Prescription
    ins.pickupStrategy = PickupStrategy.AutoWithFIFO
    ins.deliveryStatus = DeliveryStatus.Pending
    ins.paymentMoneyStatus = PaymentMoneyStatus.PendingPaid
    ins.paymentEffect = PaymentEffect.SelfPayment

    ins.quantity = 0
    ins.quantityPrescription = 0
    ins.printPrescription = 1
    ins.unitRate = 1
    ins.costAmount = 0
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
    if (Object.prototype.hasOwnProperty.call(source, 'batch')) {
      target.batch = source.batch ? Batch.basic(source.batch) : source.batch
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

  static updateByPartial(origin: TicketProduct, partial: Partial<TicketProduct>) {
    return Object.assign(origin, partial)
  }

  static updateListByPartialList(
    originList: TicketProduct[],
    partialList?: Partial<TicketProduct>[],
  ) {
    const partialMap = ESArray.arrayToKeyValue(partialList || [], 'id')
    return originList.map((i) => {
      const partial = partialMap[i.id] || {}
      return TicketProduct.updateByPartial(i, partial)
    })
  }

  static equal(a: TicketProduct, b: TicketProduct) {
    if (a.id != b.id) return false
    if (a.priority != b.priority) return false
    if (a.ticketId != b.ticketId) return false
    if (a.customerId != b.customerId) return false
    if (a.productId != b.productId) return false
    if (a.batchId != b.batchId) return false
    if (a.warehouseIds != b.warehouseIds) return false
    if (a.ticketProcedureId != b.ticketProcedureId) return false

    if (a.type != b.type) return false
    if (a.pickupStrategy != b.pickupStrategy) return false
    if (a.deliveryStatus != b.deliveryStatus) return false
    if (a.paymentMoneyStatus != b.paymentMoneyStatus) return false
    if (a.paymentEffect != b.paymentEffect) return false

    if (a.quantity != b.quantity) return false
    if (a.quantityPrescription != b.quantityPrescription) return false
    if (a.printPrescription != b.printPrescription) return false
    if (a.unitRate != b.unitRate) return false
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
