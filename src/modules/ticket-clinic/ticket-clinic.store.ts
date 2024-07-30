import { defineStore } from 'pinia'
import { CustomerDB } from '../../core/indexed-db/repository/customer.repository'
import { Customer } from '../customer'
import { TicketApi } from '../ticket/ticket.api'
import type { TicketDetailQuery } from '../ticket/ticket.dto'
import type { Ticket } from '../ticket/ticket.model'

export const useTicketClinicStore = defineStore('ticket-clinic-store', {
  state: () => {
    return {
      ticketList: <Ticket[]>[],
      paginationMeta: {
        total: 0,
        limit: Number(localStorage.getItem('TICKET_CLINIC_PAGINATION_LIMIT')) || 10,
        page: 1,
      },
      ticketHistory: <Record<string, Ticket>>{},
    }
  },

  actions: {
    async getTicketHistoryByBasic(ticket: Ticket) {
      if (
        !this.ticketHistory[ticket.id] ||
        this.ticketHistory[ticket.id].updatedAt !== ticket.updatedAt
      ) {
        this.ticketHistory[ticket.id] = await TicketApi.detail(ticket.id, {
          relation: {
            customer: true,
            ticketAttributeList: true,
            ticketProductList: { product: true, batch: true },
            ticketProcedureList: { procedure: true },
            ticketRadiologyList: { radiology: true },
            ticketLaboratoryList: {},
          },
        })
      }
      return this.ticketHistory[ticket.id]
    },

    async detail(id: number, options: TicketDetailQuery) {
      const ticketClinic = await TicketApi.detail(id, options)

      if (ticketClinic.customer) {
        const customer = Customer.from(ticketClinic.customer)
        await CustomerDB.upsertOne(customer)
      }

      return ticketClinic
    },
  },
})
