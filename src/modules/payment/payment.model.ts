import { Customer } from '../customer/customer.model'
import { Distributor } from '../distributor'
import { PaymentMethod } from '../payment-method'
import { Receipt } from '../receipt'
import { Ticket } from '../ticket'
import { User } from '../user'

export enum PaymentTiming {
  Other = 0, // Khác
  Prepayment = 1, // Thanh toán trước mua hàng
  ReceiveRefund = 2, // Nhận hoàn trả
  Close = 3, // Thanh toán trực tiếp
  PayDebt = 4, // Trả nợ (thanh toán sau mua hàng )
  Reopen = 5, // Mở lại hồ sơ
  TopUp = 10,
}

export const PaymentTimingText = {
  [PaymentTiming.Other]: 'Khác',
  [PaymentTiming.Prepayment]: 'Tạm ứng',
  [PaymentTiming.ReceiveRefund]: 'Hoàn trả',
  [PaymentTiming.Close]: 'Đóng phiếu',
  [PaymentTiming.PayDebt]: 'Trả nợ',
  [PaymentTiming.Reopen]: 'Mở lại phiếu',
  [PaymentTiming.TopUp]: 'Ghi quỹ',
}

export enum VoucherType {
  Unknown = 0,
  Receipt = 1,
  Ticket = 2,
}

export enum PersonType {
  Unknown = 0,
  Distributor = 1,
  Customer = 2,
  Employee = 3,
}

export enum MoneyDirection {
  In = 1,
  Out = 2,
}

export class Payment {
  id: number
  paymentMethodId: number
  voucherType: VoucherType
  voucherId: number
  personType: PersonType
  personId: number
  paymentTiming: PaymentTiming
  createdAt: number
  moneyDirection: MoneyDirection
  paidAmount: number // Số tiền thu
  debtAmount: number // Ghi nợ: tiền nợ thêm hoặc trả nợ
  openDebt: number // Công nợ đầu kỳ
  closeDebt: number // Công nợ cuối kỳ
  cashierId: number
  note: string // Ghi chú
  description: string

  customer: Customer
  distributor: Distributor
  ticket: Ticket
  receipt: Receipt
  employee: User
  cashier: User
  paymentMethod: PaymentMethod

  static init(): Payment {
    const ins = new Payment()
    ins.id = 0
    ins.paidAmount = 0
    ins.debtAmount = 0
    ins.openDebt = 0
    ins.closeDebt = 0
    return ins
  }

  static blank(): Payment {
    const ins = Payment.init()
    return ins
  }

  static basic(source: Payment) {
    const target = new Payment()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Payment[]): Payment[] {
    return sources.map((i) => Payment.basic(i))
  }

  static from(source: Payment) {
    const target = Payment.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'customer')) {
      target.customer = source.customer ? Customer.basic(source.customer) : source.customer
    }
    if (Object.prototype.hasOwnProperty.call(source, 'distributor')) {
      target.distributor = source.distributor
        ? Distributor.basic(source.distributor)
        : source.distributor
    }
    if (Object.prototype.hasOwnProperty.call(source, 'employee')) {
      target.employee = source.employee ? User.basic(source.employee) : source.employee
    }

    if (Object.prototype.hasOwnProperty.call(source, 'ticket')) {
      target.ticket = source.ticket ? Ticket.basic(source.ticket) : source.ticket
    }
    if (Object.prototype.hasOwnProperty.call(source, 'receipt')) {
      target.receipt = source.receipt ? Receipt.basic(source.receipt) : source.receipt
    }
    if (Object.prototype.hasOwnProperty.call(source, 'paymentMethod')) {
      target.paymentMethod = source.paymentMethod
        ? PaymentMethod.basic(source.paymentMethod)
        : source.paymentMethod
    }

    if (Object.prototype.hasOwnProperty.call(source, 'cashier')) {
      target.cashier = source.cashier ? User.basic(source.cashier) : source.cashier
    }
    return target
  }

  static fromList(roots: Payment[]) {
    return roots.map((i) => Payment.from(i))
  }
}
