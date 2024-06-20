import { Expose, instanceToPlain, plainToInstance } from 'class-transformer'
import { FROM_PLAIN } from '../_base/base-expose'
import type { PaymentType, VoucherType } from '../enum'

export class CustomerPayment {
  @Expose({ name: 'id', toClassOnly: true })
  id: number

  @Expose()
  customerId: number

  @Expose()
  voucherId: number

  @Expose()
  voucherType: VoucherType

  @Expose()
  createdAt: number

  @Expose()
  paymentType: PaymentType

  @Expose()
  paid: number = 0 // Số tiền thanh toán

  @Expose()
  debit: number // Ghi nợ: tiền nợ thêm hoặc trả nợ

  @Expose()
  openDebt: number = 0 // Dư nợ đầu kỳ của khách hàng

  @Expose() // openDebt + debit = closeDebt
  closeDebt: number = 0 // Dư nợ cuối kỳ của khách hàng

  @Expose()
  note: string = ''

  @Expose()
  description: string = ''

  static init(): CustomerPayment {
    const ins = new CustomerPayment()
    ins.id = 0
    return ins
  }

  static blank(): CustomerPayment {
    const ins = CustomerPayment.init()
    return ins
  }

  static toBasic(root: CustomerPayment) {
    const ins = new CustomerPayment()
    Object.assign(ins, root)
    return ins
  }

  static toBasics(roots: CustomerPayment[]) {
    return roots.map((i) => CustomerPayment.toBasic(i))
  }

  static fromPlain(plain: Record<string, any>): CustomerPayment {
    return plainToInstance(CustomerPayment, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(plains: Record<string, any>[]): CustomerPayment[] {
    return plainToInstance(CustomerPayment, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static toPlain(instance: Partial<CustomerPayment>): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}
