import { Customer } from '../customer/customer.model'
import { Distributor } from '../distributor'
import { LaboratoryGroupService } from '../laboratory-group'
import { PaymentPurchaseOrder } from '../payment-purchase-order/payment_purchase_order.model'
import { PaymentTicket, PaymentTicketItemType } from '../payment_ticket'
import { ProcedureService } from '../procedure'
import { ProductService } from '../product'
import { RadiologyService } from '../radiology'
import { RegimenService } from '../regimen'
import { User } from '../user'
import { Wallet } from '../wallet/wallet.model'
import { PaymentPersonType, type MoneyDirection, type PaymentActionType } from './payment.type'

export class Payment {
  id: string
  personType: PaymentPersonType
  personId: number
  cashierId: number
  walletId: string

  paymentActionType: PaymentActionType
  moneyDirection: MoneyDirection
  createdAt: number
  note: string // Ghi chú

  paidTotal: number
  debtTotal: number
  personOpenDebt: number
  personCloseDebt: number
  walletOpenMoney: number
  walletCloseMoney: number

  paymentTicketList: PaymentTicket[]
  paymentPurchaseOrderList: PaymentPurchaseOrder[]

  customer: Customer
  distributor: Distributor
  employee: User
  cashier: User

  wallet: Wallet

  static init(): Payment {
    const ins = new Payment()
    ins.id = ''
    ins.personType = PaymentPersonType.Other
    ins.personId = 0
    ins.walletId = ''
    ins.cashierId = 0

    ins.note = ''

    ins.paidTotal = 0
    ins.debtTotal = 0
    ins.personOpenDebt = 0
    ins.personCloseDebt = 0
    ins.walletOpenMoney = 0
    ins.walletCloseMoney = 0

    ins.paymentTicketList = []
    ins.paymentPurchaseOrderList = []
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
    if (Object.prototype.hasOwnProperty.call(source, 'cashier')) {
      target.cashier = source.cashier ? User.basic(source.cashier) : source.cashier
    }
    if (Object.prototype.hasOwnProperty.call(source, 'wallet')) {
      target.wallet = source.wallet ? Wallet.basic(source.wallet) : source.wallet
    }
    if (source.paymentTicketList) {
      target.paymentTicketList = PaymentTicket.basicList(source.paymentTicketList)
    }
    if (source.paymentPurchaseOrderList) {
      target.paymentPurchaseOrderList = PaymentPurchaseOrder.basicList(
        source.paymentPurchaseOrderList,
      )
    }
    return target
  }

  static fromList(roots: Payment[]) {
    return roots.map((i) => Payment.from(i))
  }
}
