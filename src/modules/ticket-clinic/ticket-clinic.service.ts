import { MeService } from '../_me/me.service'
import { PermissionId } from '../permission/permission.enum'
import { TicketQueryApi } from '../ticket/api/ticket-query.api'
import { Ticket } from '../ticket/ticket.model'
import { TicketService } from '../ticket/ticket.service'

export class TicketClinicService {
  static ticketMap: Record<string, Ticket> = {} // lưu history

  static async getTicket(ticket: Ticket) {
    if (
      !TicketClinicService.ticketMap[ticket.id] ||
      TicketClinicService.ticketMap[ticket.id].updatedAt !== ticket.updatedAt
    ) {
      const ticketResponse = await TicketService.detail(ticket.id, {
        relation: {
          customer: true,
          ticketAttributeList: true,
          ticketProductConsumableList: {},
          ticketProductPrescriptionList: {},
          ticketProcedureList: MeService.organizationPermission.value[PermissionId.PROCEDURE]
            ? {}
            : undefined,
          ticketRadiologyList: MeService.organizationPermission.value[PermissionId.RADIOLOGY]
            ? {}
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
            : false,
        },
      })
      await ticketResponse.refreshAllData()

      TicketClinicService.ticketMap[ticket.id] = ticketResponse
    }
    return TicketClinicService.ticketMap[ticket.id]
  }
}
