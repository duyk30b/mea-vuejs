import { RoleService } from '../role'
import { UserService } from '../user'
import type { TicketUser } from './ticket-user.model'

export class TicketUserService {
  static async refreshRelation(data?: TicketUser[]) {
    if (!data?.length) return

    const [userMap, roleMap] = await Promise.all([UserService.getMap(), RoleService.getMap()])
    data.forEach((i) => {
      i.user = userMap![i.userId]
      i.role = roleMap![i.roleId]
    })
  }
}
