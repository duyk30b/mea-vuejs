import { WalletService } from '../wallet'
import type { Payment } from './payment.model'

export class PaymentService {
  static async refreshRelation(data?: Payment[]) {
    if (!data?.length) return
    const walletMap = await WalletService.getMap()
    data.forEach((i) => {
      i.wallet = walletMap![i.walletId]
    })
  }
}
