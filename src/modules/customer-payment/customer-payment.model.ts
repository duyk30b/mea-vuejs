import { Customer } from '../customer/customer.model'
import type { PaymentType } from '../enum'
import { Ticket } from '../ticket'

export class CustomerPayment {
  id: number
  customerId: number
  ticketId: number
  createdAt: number
  paymentType: PaymentType
  paid: number // Số tiền thanh toán
  debit: number // Ghi nợ: tiền nợ thêm hoặc trả nợ
  openDebt: number // Dư nợ đầu kỳ của khách hàng
  closeDebt: number // openDebt + debit = closeDebt // Dư nợ cuối kỳ của khách hàng
  note: string = ''
  description: string = ''

  ticket?: Ticket
  customer?: Customer

  static init(): CustomerPayment {
    const ins = new CustomerPayment()
    ins.id = 0
    ins.paid = 0
    ins.debit = 0
    ins.openDebt = 0
    ins.closeDebt = 0
    return ins
  }

  static blank(): CustomerPayment {
    const ins = CustomerPayment.init()
    return ins
  }

  static basic(source: CustomerPayment) {
    const target = new CustomerPayment()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: CustomerPayment[]): CustomerPayment[] {
    return sources.map((i) => CustomerPayment.basic(i))
  }

  static from(source: CustomerPayment) {
    const target = CustomerPayment.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'ticket')) {
      target.ticket = source.ticket ? Ticket.basic(source.ticket) : source.ticket
    }
    if (Object.prototype.hasOwnProperty.call(source, 'customer')) {
      target.customer = source.customer ? Customer.basic(source.customer) : source.customer
    }
    return target
  }

  static fromList(roots: CustomerPayment[]) {
    return roots.map((i) => CustomerPayment.from(i))
  }
}
