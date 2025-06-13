import { CustomerDB } from '../../core/indexed-db/repository/customer.repository'
import { MeService } from '../_me/me.service'
import { Customer } from '../customer'
import { PermissionId } from '../permission/permission.enum'
import { TicketApi } from '../ticket/ticket.api'
import type { TicketDetailQuery } from '../ticket/ticket.dto'
import { Ticket } from '../ticket/ticket.model'

export class TicketClinicService {
  static ticketMap: Record<string, Ticket> = {} // lưu history

  static async detail(id: number, options: TicketDetailQuery) {
    const ticketClinic = await TicketApi.detail(id, options)

    if (ticketClinic.customer) {
      const customer = Customer.from(ticketClinic.customer)
      await CustomerDB.upsertOne(customer)
    }

    return ticketClinic
  }

  static async getTicket(ticket: Ticket) {
    if (
      !TicketClinicService.ticketMap[ticket.id] ||
      TicketClinicService.ticketMap[ticket.id].updatedAt !== ticket.updatedAt
    ) {
      const ticketResponse = await TicketApi.detail(ticket.id, {
        relation: {
          customer: true,
          ticketAttributeList: true,
          ticketProductConsumableList: {},
          ticketProductPrescriptionList: {},
          ticketProcedureList: MeService.organizationPermission.value[PermissionId.PROCEDURE]
            ? {}
            : false,
          ticketRadiologyList: MeService.organizationPermission.value[PermissionId.RADIOLOGY]
            ? {}
            : false,
          ticketLaboratoryList: MeService.organizationPermission.value[PermissionId.LABORATORY]
            ? {}
            : false,
          ticketLaboratoryGroupList: MeService.organizationPermission.value[PermissionId.LABORATORY]
            ? {}
            : false,
          ticketLaboratoryResultList: MeService.organizationPermission.value[
            PermissionId.LABORATORY
          ]
            ? true
            : false,
        },
      })
      await ticketResponse.refreshAllData()

      TicketClinicService.ticketMap[ticket.id] = ticketResponse
    }
    return TicketClinicService.ticketMap[ticket.id]
  }
}
