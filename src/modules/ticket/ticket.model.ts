import { Appointment } from '../appointment'
import { Customer } from '../customer'
import { CustomerPayment } from '../customer-payment/customer-payment.model'
import { CustomerSource } from '../customer-source'
import { DiscountType } from '../enum'
import { Image } from '../image/image.model'
import { Procedure } from '../procedure'
import { Product } from '../product'
import { TicketAttribute, type TicketAttributeMap } from '../ticket-attribute'
import { TicketExpense } from '../ticket-expense/ticket-expense.model'
import { TicketLaboratory } from '../ticket-laboratory'
import { TicketProcedure } from '../ticket-procedure/ticket-procedure.model'
import { TicketProduct } from '../ticket-product/ticket-product.model'
import { TicketRadiology } from '../ticket-radiology'
import { TicketSurcharge } from '../ticket-surcharge/ticket-surcharge.model'
import { TicketUser } from '../ticket-user'

export enum TicketStatus {
  Schedule = 1,
  Draft = 2,
  Approved = 3,
  Executing = 4,
  Debt = 5,
  Completed = 6,
  Cancelled = 7,
}

export enum TicketType {
  Order = 2,
  Clinic = 3,
  Spa = 4,
  Eye = 5,
  Obstetric = 6,
}

export class Ticket {
  id: number
  customerId: number
  customerSourceId: number
  ticketType: TicketType
  ticketStatus: TicketStatus

  totalCostAmount: number
  procedureMoney: number
  productMoney: number
  radiologyMoney: number
  laboratoryMoney: number
  itemsActualMoney: number
  itemsDiscount: number
  itemsDiscountProduct: number // chỉ convert ở front-end
  itemsDiscountProcedure: number // chỉ convert ở front-end

  discountMoney: number
  discountPercent: number
  discountType: DiscountType

  surcharge: number // Phụ phí
  totalMoney: number // Doanh thu = procedureMoney + productMoney + phụ phí - tiền giảm giá
  expense: number
  profit: number
  paid: number
  debt: number

  imageIds: string

  year: number
  month: number
  date: number
  dailyIndex: number

  registeredAt: number // Giờ đăng ký khám
  startedAt: number | null // Giờ vào khám
  endedAt: number
  updatedAt: number | null // Giờ kết thúc khám

  customer?: Customer
  customerPaymentList?: CustomerPayment[]
  customerSource?: CustomerSource
  ticketAttributeList?: TicketAttribute[]
  ticketProductList?: TicketProduct[]
  ticketProductConsumableList?: TicketProduct[]
  ticketProductPrescriptionList?: TicketProduct[]
  ticketProcedureList?: TicketProcedure[]
  ticketLaboratoryList?: TicketLaboratory[]
  ticketRadiologyList?: TicketRadiology[]
  ticketUserList?: TicketUser[]
  ticketSurchargeList?: TicketSurcharge[]
  ticketExpenseList?: TicketExpense[]

  toAppointment?: Appointment
  imageList: Image[]

  ticketAttributeMap: TicketAttributeMap // chỉ convert tại front-end

  static init(): Ticket {
    const ins = new Ticket()
    ins.id = 0
    ins.ticketStatus = TicketStatus.Draft
    ins.totalCostAmount = 0
    ins.procedureMoney = 0
    ins.productMoney = 0
    ins.radiologyMoney = 0
    ins.laboratoryMoney = 0
    ins.discountMoney = 0
    ins.discountPercent = 0
    ins.discountType = DiscountType.Percent
    ins.surcharge = 0
    ins.totalMoney = 0
    ins.expense = 0
    ins.profit = 0
    ins.paid = 0
    ins.debt = 0
    return ins
  }

  static blank(): Ticket {
    const ins = Ticket.init()
    // ins.customer = Customer.init() // Uncaught ReferenceError: Cannot access 'Customer' before initialization
    ins.customerPaymentList = []
    ins.ticketAttributeList = []
    ins.ticketAttributeMap = {}
    ins.ticketProcedureList = []
    ins.ticketProductList = []
    ins.ticketRadiologyList = []
    ins.ticketUserList = []
    ins.ticketSurchargeList = [TicketSurcharge.init()]
    ins.ticketExpenseList = [TicketExpense.init()]
    ins.imageList = []

    return ins
  }

  static basic(source: Ticket) {
    const target = new Ticket()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Ticket[]): Ticket[] {
    return sources.map((i) => Ticket.basic(i))
  }

  static from(source: Ticket) {
    const target = Ticket.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'customer')) {
      target.customer = target.customer ? Customer.basic(target.customer) : target.customer
    }
    if (Object.prototype.hasOwnProperty.call(source, 'customerSource')) {
      target.customerSource = target.customerSource
        ? CustomerSource.basic(target.customerSource)
        : target.customerSource
    }

    if (Object.prototype.hasOwnProperty.call(source, 'toAppointment')) {
      target.toAppointment = target.toAppointment
        ? Appointment.basic(target.toAppointment)
        : target.toAppointment
    }

    if (target.ticketAttributeList) {
      target.ticketAttributeList = TicketAttribute.basicList(target.ticketAttributeList)
      target.ticketAttributeMap = TicketAttribute.basicMap(target.ticketAttributeList)
    }

    if (target.customerPaymentList) {
      target.customerPaymentList = CustomerPayment.basicList(target.customerPaymentList)
    }
    if (target.ticketProductList) {
      target.ticketProductList = TicketProduct.basicList(target.ticketProductList)
      target.ticketProductList.forEach((i) => {
        i.product = Product.basic(i.product!)
      })
    }
    if (target.ticketProductPrescriptionList) {
      target.ticketProductPrescriptionList = TicketProduct.basicList(
        target.ticketProductPrescriptionList
      )
      target.ticketProductPrescriptionList.forEach((i) => {
        i.product = Product.basic(i.product!)
      })
    }
    if (target.ticketProductConsumableList) {
      target.ticketProductConsumableList = TicketProduct.basicList(
        target.ticketProductConsumableList
      )
      target.ticketProductConsumableList.forEach((i) => {
        i.product = Product.basic(i.product!)
      })
    }
    if (target.ticketProcedureList) {
      target.ticketProcedureList = TicketProcedure.basicList(target.ticketProcedureList)
      target.ticketProcedureList.forEach((i) => {
        i.procedure = Procedure.basic(i.procedure!)
      })
    }
    if (target.ticketLaboratoryList) {
      target.ticketLaboratoryList = TicketLaboratory.basicList(target.ticketLaboratoryList)
    }
    if (target.ticketRadiologyList) {
      target.ticketRadiologyList = TicketRadiology.basicList(target.ticketRadiologyList)
    }
    if (target.ticketUserList) {
      target.ticketUserList = TicketUser.basicList(target.ticketUserList)
    }
    if (target.ticketSurchargeList) {
      target.ticketSurchargeList = TicketSurcharge.basicList(target.ticketSurchargeList)
    }
    if (target.ticketExpenseList) {
      target.ticketExpenseList = TicketExpense.basicList(target.ticketExpenseList)
    }

    if (target.imageList) {
      target.imageList = Image.basicList(target.imageList)
    }
    return target
  }

  static fromList(sourceList: Ticket[]) {
    return sourceList.map((i) => Ticket.from(i))
  }

  static equal(a: Ticket, b: Ticket) {
    if (a.id != b.id) return false
    if (a.customerId != b.customerId) return false
    if (a.customerSourceId != b.customerSourceId) return false
    if (a.ticketType != b.ticketType) return false
    if (a.ticketStatus != b.ticketStatus) return false

    if (a.totalCostAmount != b.totalCostAmount) return false
    if (a.procedureMoney != b.procedureMoney) return false
    if (a.productMoney != b.productMoney) return false
    if (a.radiologyMoney != b.radiologyMoney) return false
    if (a.laboratoryMoney != b.laboratoryMoney) return false
    if (a.itemsDiscount != b.itemsDiscount) return false

    if (a.discountMoney != b.discountMoney) return false
    if (a.discountPercent != b.discountPercent) return false
    // if (a.discountType != b.discountType) return false

    if (a.surcharge != b.surcharge) return false
    if (a.totalMoney != b.totalMoney) return false
    if (a.expense != b.expense) return false
    if (a.profit != b.profit) return false
    if (a.paid != b.paid) return false
    if (a.debt != b.debt) return false

    if (a.imageIds != b.imageIds) return false
    if (a.year != b.year) return false
    if (a.month != b.month) return false
    if (a.date != b.date) return false
    if (a.dailyIndex != b.dailyIndex) return false

    if (a.registeredAt != b.registeredAt) return false
    if (a.startedAt != b.startedAt) return false
    if (a.endedAt != b.endedAt) return false
    if (a.updatedAt != b.updatedAt) return false

    return true
  }
}
