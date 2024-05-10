import {
  Expose,
  instanceToInstance,
  instanceToPlain,
  plainToInstance,
  Type,
} from 'class-transformer'
import { FROM_INSTANCE, FROM_PLAIN, USER_CREATE, USER_UPDATE } from '../_base/base-expose'
import { BaseModel } from '../base.model'
import { Customer } from '../customer'
import { CustomerPayment } from '../customer-payment/customer-payment.model'
import { DiscountType } from '../enum'
import { InvoiceItem } from '../invoice-item/invoice-item.model'
import { InvoiceExpense } from './invoice-expense.model'
import { InvoiceSurcharge } from './invoice-surcharge.model'

export enum InvoiceStatus {
  Refund = -1,
  Draft = 0,
  AwaitingShipment = 1,
  Debt = 2,
  Success = 3,
}

export class Invoice extends BaseModel {
  @Expose({ toClassOnly: true })
  arrivalId: number

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE, USER_CREATE] })
  customerId: number

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  status: InvoiceStatus

  @Expose()
  itemsCostMoney: number // tổng tiền cost = tổng cost sản phẩm

  @Expose()
  itemsActualMoney: number // totalItemProduct + totalItemProcedure

  @Expose()
  discountMoney: number // tiền giảm giá

  @Expose()
  discountPercent: number // % giảm giá

  @Expose()
  discountType: DiscountType // Loại giảm giá

  @Expose()
  surcharge: number // phụ phí

  @Expose()
  revenue: number // Doanh thu = totalItemMoney + phụ phí - tiền giảm giá

  @Expose()
  expense: number // Mục này sẽ không hiện trong đơn hàng, khách hàng ko nhìn thấy

  @Expose()
  profit: number // tiền lãi = Doanh thu - tiền cost - khoản chi

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  paid: number // tiền đã thanh toán

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  debt: number // tiền nợ

  @Expose()
  note: string // Ghi chú

  @Expose()
  startedAt: number

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  shippedAt: number

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  deletedAt: number

  @Expose({ groups: [FROM_PLAIN, USER_CREATE, USER_UPDATE] })
  @Type(() => InvoiceItem)
  invoiceItems?: InvoiceItem[]

  @Expose({ groups: [FROM_PLAIN, USER_CREATE, USER_UPDATE] })
  @Type(() => InvoiceSurcharge)
  invoiceSurcharges?: InvoiceSurcharge[] // Phụ phí chi tiết

  @Expose({ groups: [FROM_PLAIN, USER_CREATE, USER_UPDATE] })
  @Type(() => InvoiceExpense)
  invoiceExpenses?: InvoiceExpense[] // Chi phí chi tiết

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => Customer)
  customer?: Customer

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => CustomerPayment)
  customerPayments: CustomerPayment[]

  static init() {
    const ins = new Invoice()
    ins.id = 0
    ins.status = InvoiceStatus.Draft
    ins.itemsCostMoney = 0
    ins.itemsActualMoney = 0
    ins.discountMoney = 0
    ins.discountPercent = 0
    ins.discountType = DiscountType.Percent
    ins.surcharge = 0
    ins.revenue = 0
    ins.expense = 0
    ins.profit = 0
    ins.paid = 0
    ins.debt = 0
    return ins
  }

  static blank(): Invoice {
    const instance = Invoice.init()
    instance.invoiceItems = []
    instance.customerPayments = []
    instance.customer = Customer.init()
    instance.invoiceExpenses = [InvoiceExpense.init()]
    instance.invoiceSurcharges = [InvoiceExpense.init()]
    return instance
  }

  static fromPlain(dto: Record<string, any>): Invoice {
    return plainToInstance(Invoice, dto, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(dto: Record<string, any>[]): Invoice[] {
    return plainToInstance(Invoice, dto, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromInstance(instance: Invoice): Invoice {
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_INSTANCE],
    })
  }

  static toPlain(
    instance: Invoice,
    type: typeof USER_CREATE | typeof USER_UPDATE
  ): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }
}
