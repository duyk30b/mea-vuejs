import { CustomerDB } from '../../core/indexed-db'
import { Customer } from '../customer'
import { TicketProductService } from '../ticket-product'
import { TicketQueryApi } from './api/ticket-query.api'
import type { TicketDetailQuery } from './ticket.dto'
import type { Ticket } from './ticket.model'

export class TicketService {
  static ticketMap: Record<string, Ticket> = {} // lưu history

  static async detail(ticketId: string, options: TicketDetailQuery) {
    const { ticket } = await TicketQueryApi.detail(ticketId, options)

    if (ticket.customer) {
      const customer = Customer.from(ticket.customer)
      await CustomerDB.upsertOne(customer)
    }

    return ticket
  }

  static async getTicket(ticket: Ticket) {
    if (
      !TicketService.ticketMap[ticket.id] ||
      TicketService.ticketMap[ticket.id].createdAt !== ticket.createdAt
    ) {
      const ticketResponse = await TicketService.detail(ticket.id, {
        relation: {
          customer: true,
          imageList: true,
          ticketAttributeList: true,
          ticketRegimenList: true,
          ticketRegimenItemList: true,
          ticketProcedureList: true,
          ticketProductList: {},
          ticketRadiologyList: true,
          ticketLaboratoryList: true,
          ticketLaboratoryGroupList: true,
          ticketLaboratoryResultList: true,
        },
      })
      await ticketResponse.refreshAllData()
      await TicketProductService.refreshRelation(ticketResponse.ticketProductList || [])

      TicketService.ticketMap[ticket.id] = ticketResponse
    }
    return TicketService.ticketMap[ticket.id]
  }
}
