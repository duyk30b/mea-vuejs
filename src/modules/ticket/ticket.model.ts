import { Customer } from '../customer'
import { CustomerPayment } from '../customer-payment/customer-payment.model'
import { DeliveryStatus, DiscountType, VoucherType } from '../enum'
import { Procedure } from '../procedure'
import { Product } from '../product'
import { TicketDiagnosis } from '../ticket-diagnosis'
import { TicketExpense } from '../ticket-expense/ticket-expense.model'
import { TicketProcedure } from '../ticket-procedure/ticket-procedure.model'
import { TicketProduct } from '../ticket-product/ticket-product.model'
import { TicketRadiology } from '../ticket-radiology'
import { TicketSurcharge } from '../ticket-surcharge/ticket-surcharge.model'
import type { User } from '../user'

export enum TicketStatus {
  Schedule = 1,
  Draft = 2,
  Approved = 3,
  Executing = 4,
  Debt = 5,
  Completed = 6,
  Cancelled = 7,
}

export class Ticket {
  id: number
  customerId: number
  voucherType: VoucherType
  ticketStatus: TicketStatus
  deliveryStatus: DeliveryStatus
  totalCostAmount: number
  proceduresMoney: number
  productsMoney: number
  radiologyMoney: number
  discountMoney: number // tiền giảm giá
  discountPercent: number // % giảm giá
  discountType: DiscountType // Loại giảm giá
  surcharge: number // Phụ phí
  totalMoney: number // Doanh thu = proceduresMoney + productsMoney + phụ phí - tiền giảm giá
  expense: number
  profit: number
  paid: number
  debt: number
  note: string
  registeredAt: number // Giờ đăng ký khám
  startedAt: number | null // Giờ vào khám
  endedAt: number
  updatedAt: number | null // Giờ kết thúc khám

  customer?: Customer
  user?: User
  customerPaymentList?: CustomerPayment[]
  ticketDiagnosis?: TicketDiagnosis
  ticketProductList?: TicketProduct[]
  ticketProcedureList?: TicketProcedure[]
  ticketRadiologyList?: TicketRadiology[]
  ticketSurchargeList?: TicketSurcharge[]
  ticketExpenseList?: TicketExpense[]

  static init(): Ticket {
    const ins = new Ticket()
    ins.id = 0
    ins.ticketStatus = TicketStatus.Draft
    ins.totalCostAmount = 0
    ins.proceduresMoney = 0
    ins.productsMoney = 0
    ins.radiologyMoney = 0
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
    ins.ticketDiagnosis = TicketDiagnosis.init()
    ins.ticketProcedureList = []
    ins.ticketProductList = []
    ins.ticketRadiologyList = []
    ins.ticketSurchargeList = [TicketSurcharge.init()]
    ins.ticketExpenseList = [TicketExpense.init()]

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
    if (Object.prototype.hasOwnProperty.call(source, 'ticketDiagnosis')) {
      target.ticketDiagnosis = target.ticketDiagnosis
        ? TicketDiagnosis.basic(target.ticketDiagnosis)
        : target.ticketDiagnosis
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
    if (target.ticketProcedureList) {
      target.ticketProcedureList = TicketProcedure.basicList(target.ticketProcedureList)
      target.ticketProcedureList.forEach((i) => {
        i.procedure = Procedure.basic(i.procedure!)
      })
    }
    if (target.ticketRadiologyList) {
      target.ticketRadiologyList = TicketRadiology.basicList(target.ticketRadiologyList)
    }
    if (target.ticketSurchargeList) {
      target.ticketSurchargeList = TicketSurcharge.basicList(target.ticketSurchargeList)
    }
    if (target.ticketExpenseList) {
      target.ticketExpenseList = TicketExpense.basicList(target.ticketExpenseList)
    }
    return target
  }

  static fromList(sourceList: Ticket[]) {
    return sourceList.map((i) => Ticket.from(i))
  }
}
