import type { PaymentType } from '../enum'

export class DistributorPayment {
  id: number
  distributorId: number
  receiptId: number
  createdAt: number
  paymentType: PaymentType
  paid: number = 0 // Số tiền thanh toán
  debit: number // Ghi nợ: tiền nợ thêm hoặc trả nợ
  openDebt: number = 0 // Dư nợ đầu kỳ của NCC
  closeDebt: number = 0 // Dư nợ cuối kỳ của NCC
  note: string = ''
  description: string = ''

  static blank(): DistributorPayment {
    const instance = new DistributorPayment()
    instance.id = 0
    return instance
  }

  static basic(source: DistributorPayment) {
    const target = new DistributorPayment()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: DistributorPayment[]): DistributorPayment[] {
    return sources.map((i) => DistributorPayment.basic(i))
  }

  static from(source: DistributorPayment) {
    const target = DistributorPayment.basic(source)
    return target
  }

  static fromList(sourceList: DistributorPayment[]): DistributorPayment[] {
    return sourceList.map((i) => DistributorPayment.from(i))
  }
}
