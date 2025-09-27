import { CustomerDB } from '../../core/indexed-db/repository/customer.repository'
import { Customer } from '../customer'
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
          ticketProcedureList: true,
          ticketRegimenList: true,
          ticketRegimenItemList: true,
          ticketRadiologyList: true,
          ticketLaboratoryList: true,
          ticketLaboratoryGroupList: true,
          ticketLaboratoryResultList: true,
        },
      })
      await ticketResponse.refreshAllData()

      TicketService.ticketMap[ticket.id] = ticketResponse
    }
    return TicketService.ticketMap[ticket.id]
  }
}
