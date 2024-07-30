import { defineStore } from 'pinia'
import { CustomerDB } from '../../core/indexed-db/repository/customer.repository'
import { Customer } from '../customer'
import { TicketApi } from '../ticket/ticket.api'
import type { TicketDetailQuery } from '../ticket/ticket.dto'
import type { Ticket } from '../ticket/ticket.model'

export const useTicketOrderStore = defineStore('ticket-order-store', {
  state: () => {
    return {
      ticketList: <Ticket[]>[],
    }
  },

  actions: {
    async detail(id: number, options: TicketDetailQuery) {
      const ticketOrder = await TicketApi.detail(id, options)

      if (ticketOrder.customer) {
        const customer = Customer.from(ticketOrder.customer)
        await CustomerDB.upsertOne(customer)
      }

      return ticketOrder
    },
  },
})
