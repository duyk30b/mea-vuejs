import { ProcedureService } from '../procedure'
import { RegimenService } from '../regimen'
import type { TicketRegimenItem } from './ticket-regimen-item.model'
import { TicketRegimen } from './ticket-regimen.model'

export class TicketRegimenService {
  static async refreshRelation(data?: TicketRegimen[]) {
    if (!data?.length) return
    const regimenMap = await RegimenService.getMap()
    data.forEach((i) => {
      i.regimen = regimenMap![i.regimenId]
    })
  }

  static async refreshRelationItem(data?: TicketRegimenItem[]) {
    if (!data?.length) return
    const procedureMap = await ProcedureService.getMap()
    data.forEach((i) => {
      i.procedure = procedureMap![i.procedureId]
    })
  }
}
