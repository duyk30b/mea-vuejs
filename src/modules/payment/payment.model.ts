import { Customer } from '../customer/customer.model'
import { Distributor } from '../distributor'
import { Laboratory, LaboratoryService } from '../laboratory'
import { PaymentItem, PaymentVoucherItemType, PaymentVoucherType } from '../payment-item'
import { PaymentMethod } from '../payment-method'
import { ProcedureService } from '../procedure'
import { ProductService } from '../product'
import { RadiologyService } from '../radiology'
import { User, UserService } from '../user'

export enum PaymentPersonType {
  Other = 0,
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
  paymentPersonType: PaymentPersonType
  personId: number
  createdAt: number
  moneyDirection: MoneyDirection
  money: number // Số tiền thu
  cashierId: number
  note: string // Ghi chú
  reason: string

  customer: Customer
  distributor: Distributor
  employee: User
  cashier: User

  paymentItemList: PaymentItem[]
  paymentMethod: PaymentMethod

  static init(): Payment {
    const ins = new Payment()
    ins.id = 0
    ins.paymentMethodId = 0
    ins.personId = 0
    ins.paymentPersonType = 0
    ins.money = 0
    ins.cashierId = 0
    ins.note = ''
    ins.reason = ''
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
    if (Object.prototype.hasOwnProperty.call(source, 'paymentMethod')) {
      target.paymentMethod = source.paymentMethod
        ? PaymentMethod.basic(source.paymentMethod)
        : source.paymentMethod
    }
    if (source.paymentItemList) {
      target.paymentItemList = PaymentItem.basicList(source.paymentItemList)
    }
    return target
  }

  static fromList(roots: Payment[]) {
    return roots.map((i) => Payment.from(i))
  }

  static async refreshData(payment: Payment) {
    const productIdList = payment.paymentItemList
      .filter((i) => {
        return (
          (i.voucherItemType === PaymentVoucherItemType.TicketProductConsumable ||
            i.voucherItemType === PaymentVoucherItemType.TicketProductPrescription) &&
          i.voucherType === PaymentVoucherType.Ticket
        )
      })
      .map((i) => i.paymentInteractId)

    const [productMap, procedureMap, laboratoryMap, radiologyMap, userMap] = await Promise.all([
      ProductService.map({ filter: { id: { IN: productIdList } } }),
      ProcedureService.getMap(),
      LaboratoryService.getMap(),
      RadiologyService.getMap(),
      UserService.getMap(),
    ])

    payment.paymentItemList.forEach((i) => {
      i.cashier = userMap[i.cashierId] || User.blank()

      if (i.voucherType !== PaymentVoucherType.Ticket) return
      if (i.voucherItemType === PaymentVoucherItemType.TicketProcedure) {
        i.interactName = procedureMap[i.paymentInteractId]?.name || ''
      }
      if (i.voucherItemType === PaymentVoucherItemType.TicketProductConsumable) {
        i.interactName = productMap[i.paymentInteractId]?.brandName || ''
      }
      if (i.voucherItemType === PaymentVoucherItemType.TicketProductPrescription) {
        i.interactName = productMap[i.paymentInteractId]?.brandName || ''
      }
      if (i.voucherItemType === PaymentVoucherItemType.TicketLaboratory) {
        i.interactName = laboratoryMap[i.paymentInteractId]?.name || ''
      }
      if (i.voucherItemType === PaymentVoucherItemType.TicketRadiology) {
        i.interactName = radiologyMap[i.paymentInteractId]?.name || ''
      }
    })
    return payment
  }
}
