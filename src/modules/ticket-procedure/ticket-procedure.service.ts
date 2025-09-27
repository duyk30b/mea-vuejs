import { ProcedureService } from '../procedure'
import { TicketProcedure } from './ticket-procedure.model'

export class TicketProcedureService {
  static async refreshRelation(data: TicketProcedure[]) {
    if (!data.length) return
    const procedureMap = await ProcedureService.getMap()
    data.forEach((i) => {
      i.procedure = procedureMap![i.procedureId]
    })
  }
}
