import { LaboratoryService } from '../laboratory'
import { ProcedureService } from '../procedure'
import { ProductService } from '../product'
import { RadiologyService } from '../radiology'
import { RegimenService } from '../regimen'
import { WalletService } from '../wallet'
import { PaymentTicketItemType, type PaymentTicket } from './payment_ticket.model'

export class PaymentTicketService {
  static async refreshRelation(paymentTicketList: PaymentTicket[] = []) {
    if (!paymentTicketList.length) {
      return []
    }
    const productIdList = paymentTicketList
      .filter((i) => {
        return (
          i.paymentTicketItemType === PaymentTicketItemType.TicketProductConsumable ||
          i.paymentTicketItemType === PaymentTicketItemType.TicketProductPrescription
        )
      })
      .map((i) => i.ticketItemInteractId)

    const [walletMap, regimenMap, procedureMap, productMap, laboratoryMap, radiologyMap] =
      await Promise.all([
        WalletService.getMap(),
        RegimenService.getMap(),
        ProcedureService.getMap(),
        ProductService.map({ filter: { id: { IN: productIdList } } }),
        LaboratoryService.getMap(),
        RadiologyService.getMap(),
      ])

    paymentTicketList.forEach((i) => {
      if (i.payment) {
        i.payment.wallet = walletMap![i.payment.walletId]
      }
      if (i.paymentTicketItemType === PaymentTicketItemType.TicketRegimen) {
        i.regimen = regimenMap[i.ticketItemInteractId]
      }
      if (i.paymentTicketItemType === PaymentTicketItemType.TicketProcedure) {
        i.procedure = procedureMap[i.ticketItemInteractId]
      }
      if (i.paymentTicketItemType === PaymentTicketItemType.TicketProductConsumable) {
        i.product = productMap[i.ticketItemInteractId]
      }
      if (i.paymentTicketItemType === PaymentTicketItemType.TicketProductPrescription) {
        i.product = productMap[i.ticketItemInteractId]
      }
      if (i.paymentTicketItemType === PaymentTicketItemType.TicketLaboratory) {
        i.laboratory = laboratoryMap[i.ticketItemInteractId]
      }
      if (i.paymentTicketItemType === PaymentTicketItemType.TicketRadiology) {
        i.radiology = radiologyMap[i.ticketItemInteractId]
      }
    })
    return paymentTicketList
  }
}
