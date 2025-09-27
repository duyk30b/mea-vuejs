import { LaboratoryService } from '../laboratory'
import { LaboratoryGroupService } from '../laboratory-group'
import { RoomService } from '../room'
import type { TicketLaboratoryGroup } from './ticket-laboratory-group.model'
import type { TicketLaboratoryResult } from './ticket-laboratory-result.model'
import type { TicketLaboratory } from './ticket-laboratory.model'

export class TicketLaboratoryService {
  static async refreshRelation(data?: TicketLaboratory[]) {
    if (!data?.length) return
    const [roomMap, laboratoryMap] = await Promise.all([
      RoomService.getMap(),
      LaboratoryService.getMap(),
    ])
    data.forEach((i) => {
      i.room = roomMap[i.roomId]
      i.laboratory = laboratoryMap![i.laboratoryId]
    })
  }

  static async refreshRelationGroup(data?: TicketLaboratoryGroup[]) {
    if (!data?.length) return
    const [roomMap, laboratoryGroupMap] = await Promise.all([
      RoomService.getMap(),
      LaboratoryGroupService.getMap(),
    ])
    data.forEach((i) => {
      i.room = roomMap[i.roomId]
      i.laboratoryGroup = laboratoryGroupMap![i.laboratoryGroupId]
    })
  }

  static async refreshRelationResult(data?: TicketLaboratoryResult[]) {
    if (!data?.length) return
    const laboratoryMap = await LaboratoryService.getMap()
    data.forEach((i) => {
      i.laboratory = laboratoryMap![i.laboratoryId]
    })
  }
}
