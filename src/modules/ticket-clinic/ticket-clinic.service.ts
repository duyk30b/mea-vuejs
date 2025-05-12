import { ESArray } from '../../utils'
import { LaboratoryService } from '../laboratory'
import { LaboratoryGroupService } from '../laboratory-group'
import { ProcedureService } from '../procedure'
import { ProductService } from '../product'
import { RadiologyService } from '../radiology'
import { TicketApi } from '../ticket/ticket.api'
import { Ticket } from '../ticket/ticket.model'

export class TicketClinicService {
  static ticketMap: Record<string, Ticket> = {} // lưu history

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
          ticketProcedureList: {},
          ticketRadiologyList: {},
          ticketLaboratoryList: {},
          ticketLaboratoryGroupList: {},
          ticketLaboratoryResultList: true,
        },
      })
      const fetchData = await Promise.all([
        ProcedureService.getMap(),
        LaboratoryService.getMap(),
        LaboratoryGroupService.getMap(),
        RadiologyService.getMap(),
        ProductService.list({}),
      ])
      const procedureMap = fetchData[0]
      const laboratoryMap = fetchData[1]
      const laboratoryGroupMap = fetchData[2]
      const radiologyMap = fetchData[3]
      const productMap = ESArray.arrayToKeyValue(fetchData[4], 'id')

      Ticket.refreshTreeData(ticketResponse, {
        procedureMap,
        laboratoryMap,
        laboratoryGroupMap,
        radiologyMap,
        productMap,
      })

      TicketClinicService.ticketMap[ticket.id] = ticketResponse
    }
    return TicketClinicService.ticketMap[ticket.id]
  }
}
