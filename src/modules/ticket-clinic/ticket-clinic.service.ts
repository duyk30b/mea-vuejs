import { MeService } from '../_me/me.service'
import { PermissionId } from '../permission/permission.enum'
import { TicketQueryApi } from '../ticket/api/ticket-query.api'
import { Ticket } from '../ticket/ticket.model'

export class TicketClinicService {
  static ticketMap: Record<string, Ticket> = {} // lưu history

  static async getTicket(ticket: Ticket) {
    if (
      !TicketClinicService.ticketMap[ticket.id] ||
      TicketClinicService.ticketMap[ticket.id].updatedAt !== ticket.updatedAt
    ) {
      const ticketResponse = await TicketQueryApi.detail(ticket.id, {
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
