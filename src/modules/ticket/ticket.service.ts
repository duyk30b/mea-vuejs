import { CustomerDB } from '../../core/indexed-db/repository/customer.repository'
import { MeService } from '../_me/me.service'
import { Customer } from '../customer'
import { PermissionId } from '../permission/permission.enum'
import { TicketQueryApi } from './api/ticket-query.api'
import type { TicketDetailQuery } from './ticket.dto'
import type { Ticket } from './ticket.model'

export class TicketService {
  static ticketMap: Record<string, Ticket> = {} // lưu history

  static async detail(id: number, options: TicketDetailQuery) {
    const { ticket } = await TicketQueryApi.detail(id, options)

    if (ticket.customer) {
      const customer = Customer.from(ticket.customer)
      await CustomerDB.upsertOne(customer)
    }

    return ticket
  }

  static async getTicket(ticket: Ticket) {
    if (
      !TicketService.ticketMap[ticket.id] ||
      TicketService.ticketMap[ticket.id].updatedAt !== ticket.updatedAt
    ) {
      const ticketResponse = await TicketService.detail(ticket.id, {
        relation: {
          customer: true,
          imageList: true,
          ticketAttributeList: true,
          ticketProductConsumableList: {},
          ticketProductPrescriptionList: {},
          ticketProcedureList: MeService.organizationPermission.value[PermissionId.PROCEDURE]
            ? {}
            : undefined,
          ticketRadiologyList: MeService.organizationPermission.value[PermissionId.RADIOLOGY]
            ? { relation: { imageList: true } }
            : undefined,
          ticketLaboratoryList: MeService.organizationPermission.value[PermissionId.LABORATORY]
            ? {}
            : undefined,
          ticketLaboratoryGroupList: MeService.organizationPermission.value[PermissionId.LABORATORY]
            ? {}
            : undefined,
          ticketLaboratoryResultList: MeService.organizationPermission.value[
            PermissionId.LABORATORY
          ]
            ? true
            : undefined,
        },
      })
      await ticketResponse.refreshAllData()

      TicketService.ticketMap[ticket.id] = ticketResponse
    }
    return TicketService.ticketMap[ticket.id]
  }
}
