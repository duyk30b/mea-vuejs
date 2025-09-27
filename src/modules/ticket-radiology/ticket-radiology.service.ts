import { RadiologyService } from '../radiology'
import { RadiologyGroupService } from '../radiology-group'
import { RoomService } from '../room'
import { TicketRadiology } from './ticket-radiology.model'

export class TicketRadiologyService {
  static async refreshRelation(data?: TicketRadiology[]) {
    if (!data?.length) return
    const [roomMap, radiologyMap, radiologyGroupMap] = await Promise.all([
      RoomService.getMap(),
      RadiologyService.getMap(),
      RadiologyGroupService.getMap(),
    ])
    data.forEach((i) => {
      i.room = roomMap[i.roomId]
      i.radiology = radiologyMap![i.radiologyId]
      if (i.radiology) {
        i.radiology.radiologyGroup = radiologyGroupMap[i.radiology.radiologyGroupId]
      }
    })
  }
}
