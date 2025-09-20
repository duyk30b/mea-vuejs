import { ProcedureService } from '../procedure'
import { RegimenService } from '../regimen'
import { UserService } from '../user'
import { TicketRegimen } from './ticket-regimen.model'

export class TicketRegimenService {
  static async refreshRelation(ticketRegimen: TicketRegimen) {
    const [regimenMap, procedureMap, userMap] = await Promise.all([
      RegimenService.getMap(),
      ProcedureService.getMap(),
      UserService.getMap(),
    ])

    ticketRegimen.regimen = regimenMap[ticketRegimen.regimenId]
    ticketRegimen.ticketUserRequestList?.forEach((tu) => {
      tu.user = userMap[tu.userId]
    })
    ticketRegimen.ticketProcedureList?.forEach((tp) => {
      tp.procedure = procedureMap[tp.procedureId]
      tp.ticketUserResultList.forEach((tu) => {
        tu.user = userMap[tu.userId]
      })
    })
  }
}
