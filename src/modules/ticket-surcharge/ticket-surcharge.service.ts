import { SurchargeService } from '../surcharge'
import type { TicketSurcharge } from './ticket-surcharge.model'

export class TicketSurchargeService {
  static async refreshRelation(data?: TicketSurcharge[]) {
    if (!data?.length) return
    const surchargeMap = await SurchargeService.getMap()
    data.forEach((i) => {
      i.surcharge = surchargeMap[i.surchargeId]
    })
  }
}
