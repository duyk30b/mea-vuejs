import { ESArray, type ClassProperties } from '@/utils'
import { BaseModel } from '../_base/base.model'
import { Batch } from '../batch'
import type { Customer } from '../customer'
import { DeliveryStatus, DiscountType, TicketItemPaymentType, PickupStrategy } from '../enum'
import { Product } from '../product'
import { TicketBatch } from '../ticket-batch'
import type { Ticket } from '../ticket/ticket.model'

export enum TicketProductType {
  Prescription = 1,
  Consumable = 2,
  Procedure = 3,
}
export class TicketProduct extends BaseModel {
  id: string
  priority: number

  customerId: number
  ticketId: string
  warehouseIds: string
  productId: number
  batchId: number
  ticketProcedureId: string

  type: TicketProductType
  pickupStrategy: PickupStrategy
  ticketItemPaymentType: TicketItemPaymentType

  unitRate: number
  printPrescription: number

  quantity: number
  quantityPrescription: number
  quantityCompleted: number
  costAmount: number // không thể có costPrice, vì có thể bao gồm nhiều lô với vốn khác nhau
  unitExpectedPrice: number
  unitDiscountMoney: number
  discountType: DiscountType
  discountPercent: number
  unitActualPrice: number

  paid: number

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
    return this.quantity / this.unitRate
  }

  set unitQuantity(value: number) {
    this.quantity = value * (this.unitRate || 1)
  }

  get unitQuantityPrescription() {
    return this.quantityPrescription / this.unitRate
  }

  get expectedPrice() {
    return Math.round(this.unitExpectedPrice / this.unitRate)
  }

  get actualPrice() {
    return Math.round(this.unitActualPrice / this.unitRate)
  }

  get discountMoney() {
    return Math.round(this.unitDiscountMoney / this.unitRate)
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
    this.unitExpectedPrice = Math.round((this.unitExpectedPrice * unitRate) / oldUnitRate)
    this.unitDiscountMoney = Math.round((this.unitDiscountMoney * unitRate) / oldUnitRate)
    this.unitActualPrice = Math.round((this.unitActualPrice * unitRate) / oldUnitRate)
    this.unitRate = unitRate
  }

  public changeUnitExpectedPrice(unitExpectedPrice: number) {
    const unitActualPrice = this.unitActualPrice
    const unitDiscountMoney = unitExpectedPrice - unitActualPrice
    const discountPercent =
      unitExpectedPrice == 0 ? 0 : Math.round((unitDiscountMoney * 100) / unitExpectedPrice)
    this.discountPercent = discountPercent
    this.unitDiscountMoney = unitDiscountMoney
    this.discountType = DiscountType.VND
    this.unitExpectedPrice = unitExpectedPrice
  }

  public changeUnitDiscountMoney(unitDiscountMoney: number) {
    const unitExpectedPrice = this.unitExpectedPrice || 0
    const discountPercent =
      unitExpectedPrice == 0 ? 0 : Math.round((unitDiscountMoney * 100) / unitExpectedPrice)
    this.discountPercent = discountPercent
    this.unitDiscountMoney = unitDiscountMoney
    this.unitActualPrice = unitExpectedPrice - unitDiscountMoney
  }

  public changeDiscountPercent(discountPercent: number) {
    const unitExpectedPrice = this.unitExpectedPrice || 0
    const unitDiscountMoney = Math.round((unitExpectedPrice * (discountPercent || 0)) / 100)
    this.discountPercent = discountPercent
    this.unitDiscountMoney = unitDiscountMoney
    this.unitActualPrice = unitExpectedPrice - unitDiscountMoney
  }

  public changeUnitActualPrice(unitActualPrice: number) {
    const unitExpectedPrice = this.unitExpectedPrice
    const unitDiscountMoney = unitExpectedPrice - unitActualPrice
    const discountPercent =
      unitExpectedPrice == 0 ? 0 : Math.round((unitDiscountMoney * 100) / unitExpectedPrice)
    this.discountPercent = discountPercent
    this.unitDiscountMoney = unitDiscountMoney
    this.discountType = DiscountType.VND
    this.unitActualPrice = unitActualPrice
  }

  static init(): TicketProduct {
    const ins = new TicketProduct()
    ins._localId = Math.random().toString(36).substring(2)
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
    ins.ticketItemPaymentType = TicketItemPaymentType.TicketPaid
    ins.paid = 0

    ins.quantity = 0
    ins.quantityPrescription = 0
    ins.printPrescription = 1
    ins.unitRate = 1
    ins.costAmount = 0
    ins.unitExpectedPrice = 0
    ins.unitDiscountMoney = 0
    ins.discountPercent = 0
    ins.discountType = DiscountType.Percent
    ins.unitActualPrice = 0
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

  static basic(source: ClassProperties<TicketProduct>) {
    const target = new TicketProduct()
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

  static basicList(sources: TicketProduct[]): TicketProduct[] {
    return sources.map((i) => TicketProduct.basic(i))
  }

  static from(source: ClassProperties<TicketProduct>) {
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
    if (a.ticketItemPaymentType != b.ticketItemPaymentType) return false
    if (a.paid != b.paid) return false

    if (a.quantity != b.quantity) return false
    if (a.quantityPrescription != b.quantityPrescription) return false
    if (a.quantityCompleted != b.quantityCompleted) return false
    if (a.printPrescription != b.printPrescription) return false
    if (a.unitRate != b.unitRate) return false
    if (a.costAmount != b.costAmount) return false
    if (a.unitExpectedPrice != b.unitExpectedPrice) return false
    if (a.unitDiscountMoney != b.unitDiscountMoney) return false
    if (a.discountPercent != b.discountPercent) return false
    // if (a.discountType != b.discountType) return false
    if (a.unitActualPrice != b.unitActualPrice) return false
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
