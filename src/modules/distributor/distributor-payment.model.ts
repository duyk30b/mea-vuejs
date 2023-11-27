import { Expose, instanceToPlain, plainToInstance } from 'class-transformer'
import { BaseModel } from '../base.model'
import type { PaymentType } from '../enum'

export class DistributorPayment extends BaseModel {
  @Expose()
  distributorId: number

  @Expose()
  receiptId: number

  @Expose()
  time: number

  @Expose({ toClassOnly: true })
  type: PaymentType

  @Expose()
  paid: number = 0 // Số tiền thanh toán

  @Expose()
  debit: number // Ghi nợ: tiền nợ thêm hoặc trả nợ

  @Expose()
  distributorOpenDebt: number = 0 // Dư nợ đầu kỳ của NCC

  @Expose() // distributorOpenDebt + debit = distributorCloseDebt
  distributorCloseDebt: number = 0 // Dư nợ cuối kỳ của NCC

  @Expose()
  receiptOpenDebt: number = 0 // Dư nợ đầu kỳ của phiếu nhập

  @Expose() // receiptOpenDebt + debit = receiptCloseDebt
  receiptCloseDebt: number = 0 // Dư nợ cuối kỳ của phiếu nhập

  @Expose()
  note: string = ''

  @Expose()
  description: string = ''

  static blank(): DistributorPayment {
    return new DistributorPayment()
  }

  static fromPlain(plain: Record<string, any>): DistributorPayment {
    return plainToInstance(DistributorPayment, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromPlains(plains: Record<string, any>[]): DistributorPayment[] {
    return plainToInstance(DistributorPayment, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static toPlain(instance: Partial<DistributorPayment>): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}
