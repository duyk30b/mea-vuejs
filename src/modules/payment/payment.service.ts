import { PaymentMethodService } from '../payment-method'
import type { Payment } from './payment.model'

export class PaymentService {
  static async refreshRelation(data?: Payment[]) {
    if (!data?.length) return
    const paymentMethodMap = await PaymentMethodService.getMap()
    data.forEach((i) => {
      i.paymentMethod = paymentMethodMap![i.paymentMethodId]
    })
  }
}
