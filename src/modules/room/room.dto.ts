import { OmitClass, PickClass } from '../../utils'
import type { ConditionString } from '../_base/base-condition'
import type { RoomInteractType } from './room.model'

export class RoomGetQuery {
  page?: number
  limit?: number
  relation?: {
    userRoomList?: { user?: boolean }
  }

  filter?: {
    name?: ConditionString
    roomInteractType?: RoomInteractType
    showMenu?: 1 | 0
    isCommon?: 1 | 0
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    roomCode?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<RoomGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class RoomPaginationQuery extends RoomGetQuery { }
export class RoomListQuery extends OmitClass(RoomGetQuery, ['page']) { }
export class RoomDetailQuery extends PickClass(RoomGetQuery, ['relation']) { }
