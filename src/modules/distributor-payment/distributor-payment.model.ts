import { Expose, instanceToPlain, plainToInstance } from 'class-transformer'
import { BaseModel } from '../base.model'
import type { PaymentType } from '../enum'
import { FROM_PLAIN } from '../_base/base-expose'

export class DistributorPayment {
  @Expose({ name: 'id', toClassOnly: true })
  id: number

  @Expose()
  distributorId: number

  @Expose()
  receiptId: number

  @Expose()
  createdAt: number

  @Expose({ toClassOnly: true })
  paymentType: PaymentType

  @Expose()
  paid: number = 0 // Số tiền thanh toán

  @Expose()
  debit: number // Ghi nợ: tiền nợ thêm hoặc trả nợ

  @Expose()
  openDebt: number = 0 // Dư nợ đầu kỳ của NCC

  @Expose() // openDebt + debit = closeDebt
  closeDebt: number = 0 // Dư nợ cuối kỳ của NCC

  @Expose()
  note: string = ''

  @Expose()
  description: string = ''

  static blank(): DistributorPayment {
    const instance = new DistributorPayment()
    instance.id = 0
    return instance
  }

  static toBasic(root: DistributorPayment) {
    const ins = new DistributorPayment()
    Object.assign(ins, root)
    return ins
  }

  static toBasics(roots: DistributorPayment[]) {
    return roots.map((i) => DistributorPayment.toBasic(i))
  }

  static fromPlain(plain: Record<string, any>): DistributorPayment {
    return plainToInstance(DistributorPayment, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(plains: Record<string, any>[]): DistributorPayment[] {
    return plainToInstance(DistributorPayment, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static toPlain(instance: Partial<DistributorPayment>): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}
