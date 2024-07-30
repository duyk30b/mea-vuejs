import { defineStore } from 'pinia'
import { TicketApi } from '../ticket/ticket.api'
import type { Ticket } from '../ticket/ticket.model'
import type { TicketDetailQuery } from '../ticket/ticket.dto'
import { Customer } from '../customer'
import { CustomerDB } from '../../core/indexed-db/repository/customer.repository'

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
            ticketDiagnosis: true,
            ticketProductList: true,
            ticketProcedureList: true,
            ticketRadiologyList: true,
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
