import { Customer } from '../customer/customer.model'
import { Distributor } from '../distributor'
import { LaboratoryService } from '../laboratory'
import { PaymentTicketItem, TicketItemType } from '../payment-ticket-item'
import { ProcedureService } from '../procedure'
import { ProductService } from '../product'
import { RadiologyService } from '../radiology'
import type { PurchaseOrder } from '../purchase-order'
import type { Ticket } from '../ticket'
import { User, UserService } from '../user'
import { RegimenService } from '../regimen'
import { Wallet } from '../wallet/wallet.model'

export enum PaymentPersonType {
  Other = 0,
  Distributor = 1,
  Customer = 2,
  Employee = 3,
}

export enum PaymentVoucherType {
  Other = 0, // Không xác định
  PurchaseOrder = 1,
  Ticket = 2,
}

export enum PaymentActionType {
  Other = 0, // Tạm ứng
  PaymentMoney = 1, // Thanh toán
  RefundMoney = 2, // Hoàn tiền
  Debit = 3, // Ghi nợ
  CancelDebt = 4, // Hủy nợ
  PayDebt = 5, // Trả nợ
  Close = 6, // Đóng phiếu
  Terminal = 7, // Hủy phiếu
  FixByExcel = 8,
}

export const PaymentActionTypeText = {
  [PaymentActionType.Other]: 'Khác',
  [PaymentActionType.PaymentMoney]: 'Thanh toán',
  [PaymentActionType.RefundMoney]: 'Hoàn tiền',
  [PaymentActionType.Debit]: 'Ghi nợ',
  [PaymentActionType.CancelDebt]: 'Hủy nợ',
  [PaymentActionType.PayDebt]: 'Trả nợ',
  [PaymentActionType.Close]: 'Đóng phiếu',
  [PaymentActionType.Terminal]: 'Hủy phiếu',
  [PaymentActionType.FixByExcel]: 'Cập nhật bởi Excel',
}

export enum MoneyDirection {
  Other = 0,
  In = 1,
  Out = 2,
}

export class Payment {
  id: string
  voucherType: PaymentVoucherType
  voucherId: string
  personType: PaymentPersonType
  personId: number

  walletId: string
  createdAt: number
  moneyDirection: MoneyDirection
  paymentActionType: PaymentActionType
  cashierId: number
  note: string // Ghi chú

  paid: number
  paidItem: number
  debt: number
  debtItem: number
  personOpenDebt: number
  personCloseDebt: number
  walletOpenMoney: number
  walletCloseMoney: number

  ticket: Ticket
  purchaseOrder: PurchaseOrder
  customer: Customer
  distributor: Distributor
  employee: User
  cashier: User

  paymentTicketItemList: PaymentTicketItem[]
  wallet: Wallet

  static init(): Payment {
    const ins = new Payment()
    ins.id = ''
    ins.voucherType = PaymentVoucherType.Other
    ins.voucherId = ''
    ins.personType = PaymentPersonType.Other
    ins.personId = 0

    ins.walletId = ''
    ins.cashierId = 0
    ins.note = ''

    ins.paid = 0
    ins.debt = 0
    ins.paidItem = 0
    ins.debtItem = 0
    ins.personOpenDebt = 0
    ins.personCloseDebt = 0
    ins.walletOpenMoney = 0
    ins.walletCloseMoney = 0

    ins.paymentTicketItemList = []
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
    if (source.paymentTicketItemList) {
      target.paymentTicketItemList = PaymentTicketItem.basicList(source.paymentTicketItemList)
    }
    return target
  }

  static fromList(roots: Payment[]) {
    return roots.map((i) => Payment.from(i))
  }

  static async refreshData(payment: Payment) {
    if (payment.voucherType !== PaymentVoucherType.Ticket) {
      return payment
    }
    if (!payment.paidItem && !payment.debtItem) {
      return payment
    }
    const productIdList = payment.paymentTicketItemList
      .filter((i) => {
        return (
          i.ticketItemType === TicketItemType.TicketProductConsumable ||
          i.ticketItemType === TicketItemType.TicketProductPrescription
        )
      })
      .map((i) => i.interactId)

    const [regimenMap, procedureMap, productMap, laboratoryMap, radiologyMap, userMap] =
      await Promise.all([
        RegimenService.getMap(),
        ProcedureService.getMap(),
        ProductService.map({ filter: { id: { IN: productIdList } } }),
        LaboratoryService.getMap(),
        RadiologyService.getMap(),
        UserService.getMap(),
      ])

    payment.cashier = userMap[payment.cashierId] || User.blank()
    payment.paymentTicketItemList.forEach((i) => {
      if (i.ticketItemType === TicketItemType.TicketRegimen) {
        i.interactName = regimenMap[i.interactId]?.name || ''
      }
      if (i.ticketItemType === TicketItemType.TicketProcedure) {
        i.interactName = procedureMap[i.interactId]?.name || ''
      }
      if (i.ticketItemType === TicketItemType.TicketProductConsumable) {
        i.interactName = productMap[i.interactId]?.brandName || ''
      }
      if (i.ticketItemType === TicketItemType.TicketProductPrescription) {
        i.interactName = productMap[i.interactId]?.brandName || ''
      }
      if (i.ticketItemType === TicketItemType.TicketLaboratory) {
        i.interactName = laboratoryMap[i.interactId]?.name || ''
      }
      if (i.ticketItemType === TicketItemType.TicketRadiology) {
        i.interactName = radiologyMap[i.interactId]?.name || ''
      }
    })
    return payment
  }
}
