import { Batch } from '@/modules/batch'
import { DiscountService, type Discount } from '@/modules/discount'
import { LaboratoryService, type Laboratory } from '@/modules/laboratory'
import { LaboratoryGroupService } from '@/modules/laboratory-group'
import { ProcedureService, type Procedure } from '@/modules/procedure'
import { RadiologyService, type Radiology } from '@/modules/radiology'
import { RoomService } from '@/modules/room'
import {
  roomLaboratory,
  roomRadiology,
  roomReceptionPagination,
  roomTicketPagination,
  ticketRoomRef,
} from '@/modules/room/room.ref'
import { MeService } from '../../modules/_me/me.service'
import { Customer } from '../../modules/customer'
import { Distributor, DistributorService } from '../../modules/distributor'
import { Organization } from '../../modules/organization'
import { Position, PositionService, type PositionInteractType } from '../../modules/position'
import { Product } from '../../modules/product'
import { Ticket } from '../../modules/ticket'
import { TicketAttribute } from '../../modules/ticket-attribute'
import { TicketBatch } from '../../modules/ticket-batch'
import { TicketLaboratory } from '../../modules/ticket-laboratory'
import { TicketLaboratoryGroup } from '../../modules/ticket-laboratory-group'
import { TicketLaboratoryResult } from '../../modules/ticket-laboratory-result'
import { TicketProcedure } from '../../modules/ticket-procedure'
import { TicketProduct } from '../../modules/ticket-product'
import { TicketRadiology } from '../../modules/ticket-radiology'
import { TicketUser } from '../../modules/ticket-user'
import { BatchDB } from '../indexed-db/repository/batch.repository'
import { CustomerDB } from '../indexed-db/repository/customer.repository'
import { ProductDB } from '../indexed-db/repository/product.repository'

export class SocketService {
  static listenServerEmitDemo(data: any) {
    console.log('🚀 ~ file: socket.service.ts:3 ~ listenServerEmitDemo ~ data:', data)
  }

  static async listenOrganizationUpdate(data: { organization: Organization }) {
    const organization = Organization.from(data.organization)
    MeService.organization.value = organization
  }

  static async listenSettingReload(data: any) {
    await MeService.reloadSetting()
  }

  static async listenDistributorUpsert(data: { distributor: any }) {
    const distributor = Distributor.from(data.distributor)
    const findIndex = DistributorService.distributorAll.findIndex((i) => {
      return i.id === distributor.id
    })
    if (findIndex !== -1) {
      DistributorService.distributorAll[findIndex] = distributor
    } else {
      DistributorService.distributorAll.push(distributor)
    }
  }

  static async listenCustomerUpsert(data: { customer: any }) {
    const customer = Customer.from(data.customer)
    await CustomerDB.upsertOne(customer)

    if (ticketRoomRef.value.customerId === customer.id) {
      ticketRoomRef.value.customer = customer
    }
  }

  static async listenProductListChange(data: {
    productDestroyedList?: Product[]
    productUpsertedList?: Product[]
  }) {
    if (data.productUpsertedList?.length) {
      const productUpsertedList = Product.fromList(data.productUpsertedList)
      await ProductDB.upsertMany(productUpsertedList)
    }
    if (data.productDestroyedList?.length) {
      const productIdDestroyList = data.productDestroyedList.map((i) => i.id)
      await ProductDB.deleteMany(productIdDestroyList)
    }
  }

  static async listenBatchListChange(data: {
    batchDestroyedList?: any[]
    batchUpsertedList?: any[]
  }) {
    if (data.batchUpsertedList?.length) {
      const batchUpsertedList = Batch.fromList(data.batchUpsertedList)
      await BatchDB.upsertMany(batchUpsertedList)
    }
    if (data.batchDestroyedList?.length) {
      const batchIdDestroyList = data.batchDestroyedList.map((i) => i.id)
      await BatchDB.deleteMany(batchIdDestroyList)
    }
  }

  static async listenProcedureListChange(data: {
    procedureDestroyedList?: Procedure[]
    procedureUpsertedList?: Procedure[]
  }) {
    if (data.procedureUpsertedList?.length) {
      ProcedureService.loadedAll = false
    }
    if (data.procedureDestroyedList?.length) {
      ProcedureService.loadedAll = false
    }
  }

  static async listenLaboratoryListChange(data: {
    laboratoryDestroyedList?: Laboratory[]
    laboratoryUpsertedList?: Laboratory[]
  }) {
    if (data.laboratoryUpsertedList?.length) {
      LaboratoryService.loadedAll = false
    }
    if (data.laboratoryDestroyedList?.length) {
      LaboratoryService.loadedAll = false
    }
  }

  static async listenRadiologyListChange(data: {
    radiologyDestroyedList?: Radiology[]
    radiologyUpsertedList?: Radiology[]
  }) {
    if (data.radiologyUpsertedList?.length) {
      RadiologyService.loadedAll = false
    }
    if (data.radiologyDestroyedList?.length) {
      RadiologyService.loadedAll = false
    }
  }

  static async listenPositionListChange(data: {
    positionDestroyedList?: Position[]
    positionUpsertedList?: Position[]
  }) {
    if (data.positionUpsertedList?.length) {
      PositionService.loadedAll = false
    }
    if (data.positionDestroyedList?.length) {
      PositionService.loadedAll = false
    }
  }

  static async listenDiscountListChange(data: {
    discountDestroyedList?: Discount[]
    discountUpsertedList?: Discount[]
  }) {
    if (data.discountUpsertedList?.length) {
      DiscountService.loadedAll = false
    }
    if (data.discountDestroyedList?.length) {
      DiscountService.loadedAll = false
    }
  }

  static getTicketAction(options: { ticketId: number }) {
    const { ticketId } = options

    const ticketAction: Ticket[] = []
    if (ticketRoomRef.value.id === ticketId) {
      ticketAction.push(ticketRoomRef.value)
    }

    return ticketAction
  }

  static async listenSocketTicketChange(data: {
    type: 'CREATE' | 'UPDATE' | 'DESTROY'
    ticket: any
  }) {
    const ticket = Ticket.from(data.ticket)

    if (ticketRoomRef.value.id === ticket.id) {
      Object.assign(ticketRoomRef.value, ticket)
    }

    const roomTicketPaginationReception = roomReceptionPagination.value

    if (roomTicketPaginationReception) {
      const findIndex = roomTicketPaginationReception.findIndex((i) => i.id === ticket.id)
      if (data.type === 'CREATE' || data.type === 'UPDATE') {
        if (findIndex !== -1) {
          Object.assign(roomTicketPaginationReception[findIndex], ticket)
        } else {
          roomTicketPaginationReception.unshift(ticket)
        }
      }
      if (data.type === 'DESTROY') {
        if (findIndex !== -1) {
          roomTicketPaginationReception.splice(findIndex, 1)
        }
      }
    }

    Object.entries(roomTicketPagination.value).forEach((entries) => {
      const roomId = Number(entries[0])
      const ticketPagination = entries[1]

      if (ticket.roomId === roomId || RoomService.roomMap.value[roomId]?.isCommon) {
        const findIndex = ticketPagination.findIndex((i) => i.id === ticket.id)
        if (data.type === 'CREATE' || data.type === 'UPDATE') {
          if (findIndex !== -1) {
            Object.assign(ticketPagination[findIndex], ticket)
          } else {
            ticketPagination.unshift(ticket)
          }
        }
        if (data.type === 'DESTROY') {
          if (findIndex !== -1) {
            ticketPagination.splice(findIndex, 1)
          }
        }
      } else {
        // Để xử lý trường hợp chuyển phòng
        const findIndex = ticketPagination.findIndex((i) => i.id === ticket.id)
        if (findIndex !== -1) {
          ticketPagination.splice(findIndex, 1)
        } else {
        }
      }
    })
  }

  static async listenSocketTicketListChange(data: {
    ticketDestroyedList?: any[]
    ticketUpsertedList?: any[]
  }) {
    data.ticketUpsertedList?.forEach((ticketPlain) => {
      const ticket = Ticket.from(ticketPlain)
      if (ticketRoomRef.value.id === ticket.id) {
        Object.assign(ticketRoomRef.value, ticket)
      }

      const roomTicketPaginationReception = roomReceptionPagination.value

      if (roomTicketPaginationReception) {
        const findIndex = roomTicketPaginationReception.findIndex((i) => i.id === ticket.id)
        if (findIndex !== -1) {
          Object.assign(roomTicketPaginationReception[findIndex], ticket)
        } else {
          roomTicketPaginationReception.unshift(ticket)
        }
      }

      Object.entries(roomTicketPagination.value).forEach((entries) => {
        const roomId = Number(entries[0])
        const ticketPagination = entries[1]

        if (ticket.roomId === roomId || RoomService.roomMap.value[roomId]?.isCommon) {
          const findIndex = ticketPagination.findIndex((i) => i.id === ticket.id)
          if (findIndex !== -1) {
            Object.assign(ticketPagination[findIndex], ticket)
          } else {
            ticketPagination.unshift(ticket)
          }
        } else {
          // Để xử lý trường hợp chuyển phòng
          const findIndex = ticketPagination.findIndex((i) => i.id === ticket.id)
          if (findIndex !== -1) {
            ticketPagination.splice(findIndex, 1)
          } else {
          }
        }
      })
    })
  }

  static async listenSocketTicketAttributeChange(data: {
    ticketId: number
    ticketAttributeList: any[]
  }) {
    const ticketAction: Ticket[] = SocketService.getTicketAction({
      ticketId: data.ticketId,
    })
    ticketAction.forEach((ticket) => {
      ticket.ticketAttributeList = TicketAttribute.fromList(data.ticketAttributeList)
      ticket.ticketAttributeMap = TicketAttribute.basicMap(data.ticketAttributeList)
    })
  }

  static async listenSocketTicketUserListChange(data: {
    ticketId: number
    ticketUserDestroyList?: TicketUser[]
    ticketUserUpsertList?: TicketUser[]
    replace?: {
      positionType: PositionInteractType
      ticketItemId: number // ticketItemId = 0 là thay thế toàn bộ positionType đó
      ticketUserList: TicketUser[]
    }
    replaceAll: {
      ticketUserList: TicketUser[]
    }
  }) {
    const ticketAction: Ticket[] = SocketService.getTicketAction({
      ticketId: data.ticketId,
    })
    ticketAction.forEach(async (ticket) => {
      if (!ticket.ticketUserList) return

      if (data.replace) {
        const ticketUserOtherList = ticket.ticketUserList.filter((i) => {
          if (i.positionType !== data.replace!.positionType) return true
          if (data.replace?.ticketItemId) {
            // ticketItemId = 0 là thay thế toàn bộ positionType đó nên ko filter
            if (i.ticketItemId !== data.replace!.ticketItemId) return true
          }
          return false
        })
        // let ticketUserActionList = ticket.ticketUserList.filter((i) => {
        //   if (i.positionType !== data.replace!.positionType) return false
        //   if (i.ticketItemId !== data.replace!.ticketItemId) return false
        //   return true
        // })
        const ticketUserActionList = TicketUser.fromList(data.replace!.ticketUserList)
        ticket.ticketUserList = ticketUserOtherList.concat(ticketUserActionList)
      }

      // Destroy phải  xử lý trước
      if (data.ticketUserDestroyList) {
        const idDestroyList = data.ticketUserDestroyList.map((i) => i.id)
        ticket.ticketUserList = ticket.ticketUserList.filter((i) => !idDestroyList.includes(i.id))
      }

      if (data.ticketUserUpsertList) {
        data.ticketUserUpsertList.forEach((i) => {
          const temp = TicketUser.from(i)
          const index = ticket.ticketUserList!.findIndex((j) => {
            return i.id === j.id
          })
          if (index !== -1) {
            ticket.ticketUserList![index] = temp
          } else {
            ticket.ticketUserList!.push(temp)
          }
        })
      }
      if (data.replaceAll) {
        ticket.ticketUserList = TicketUser.fromList(data.replaceAll.ticketUserList)
      }

      await ticket.refreshUserAndRole()
      ticket.refreshTicketUserGroup()
    })
  }

  static async listenSocketTicketProcedureListChange(data: {
    ticketId: number
    ticketProcedureInsert?: TicketProcedure
    ticketProcedureUpdate?: TicketProcedure
    ticketProcedureDestroy?: TicketProcedure
    ticketProcedureList?: TicketProcedure[]
  }) {
    const ticketAction: Ticket[] = SocketService.getTicketAction({
      ticketId: data.ticketId,
    })
    ticketAction.forEach(async (ticket) => {
      if (!ticket.ticketProcedureList) return

      if (data.ticketProcedureDestroy) {
        const indexDestroy = ticket.ticketProcedureList.findIndex((i) => {
          return i.id === data.ticketProcedureDestroy!.id
        })
        if (indexDestroy !== -1) {
          ticket.ticketProcedureList?.splice(indexDestroy, 1)
        }
      }

      if (data.ticketProcedureInsert) {
        const indexInsert = ticket.ticketProcedureList.findIndex((i) => {
          return data.ticketProcedureInsert?.id === i.id
        })
        if (indexInsert === -1) {
          ticket.ticketProcedureList?.push(TicketProcedure.from(data.ticketProcedureInsert))
        }
      }

      if (data.ticketProcedureUpdate) {
        const indexUpdate = ticket.ticketProcedureList.findIndex((i) => {
          return data.ticketProcedureUpdate?.id === i.id
        })
        if (indexUpdate !== -1) {
          Object.assign(
            ticket.ticketProcedureList[indexUpdate],
            TicketProcedure.from(data.ticketProcedureUpdate),
          )
        }
      }

      if (data.ticketProcedureList) {
        ticket.ticketProcedureList = TicketProcedure.fromList(data.ticketProcedureList)
      }

      await ticket.refreshProcedure()
    })
  }

  static async listenSocketTicketRadiologyListChange(data: {
    ticketId: number
    ticketRadiologyInsert?: TicketRadiology
    ticketRadiologyUpdate?: TicketRadiology
    ticketRadiologyDestroy?: TicketRadiology
    ticketRadiologyList?: TicketRadiology[]
  }) {
    const ticketAction: Ticket[] = SocketService.getTicketAction({
      ticketId: data.ticketId,
    })
    ticketAction.forEach(async (ticket) => {
      if (!ticket.ticketRadiologyList) return
      if (data.ticketRadiologyInsert) {
        const indexInsert = ticket.ticketRadiologyList.findIndex((i) => {
          return data.ticketRadiologyInsert?.id === i.id
        })
        if (indexInsert === -1) {
          ticket.ticketRadiologyList?.push(TicketRadiology.from(data.ticketRadiologyInsert))
        }
      }
      if (data.ticketRadiologyUpdate) {
        const indexUpdate = ticket.ticketRadiologyList.findIndex((i) => {
          return data.ticketRadiologyUpdate?.id === i.id
        })
        if (indexUpdate !== -1) {
          Object.assign(
            ticket.ticketRadiologyList[indexUpdate],
            TicketRadiology.from(data.ticketRadiologyUpdate),
          )
        }
      }
      if (data.ticketRadiologyDestroy) {
        const indexDestroy = ticket.ticketRadiologyList.findIndex((i) => {
          return i.id === data.ticketRadiologyDestroy!.id
        })
        if (indexDestroy !== -1) {
          ticket.ticketRadiologyList?.splice(indexDestroy, 1)
        }
      }
      if (data.ticketRadiologyList) {
        ticket.ticketRadiologyList = TicketRadiology.fromList(data.ticketRadiologyList)
      }

      await ticket.refreshRadiology()
    })
    const ticketRadiologyActionList = [
      ...(data.ticketRadiologyInsert ? [data.ticketRadiologyInsert] : []),
      ...(data.ticketRadiologyUpdate ? [data.ticketRadiologyUpdate] : []),
      ...(data.ticketRadiologyDestroy ? [data.ticketRadiologyDestroy] : []),
      ...(data.ticketRadiologyList ? data.ticketRadiologyList : []),
    ]
    ticketRadiologyActionList.forEach((tr) => {
      roomRadiology.value[tr.roomId] = new Date().toISOString()
    })
  }

  static async listenSocketTicketLaboratoryListChange(data: {
    ticketId: number
    ticketLaboratoryInsertList?: TicketLaboratory[]
    ticketLaboratoryUpdateList?: TicketLaboratory[]
    ticketLaboratoryDestroyList?: TicketLaboratory[]
    ticketLaboratoryGroupInsertList?: TicketLaboratoryGroup[]
    ticketLaboratoryGroupUpdate?: TicketLaboratoryGroup
    ticketLaboratoryGroupDestroy?: TicketLaboratoryGroup
    ticketLaboratoryResultInsertList?: TicketLaboratoryResult[]
    ticketLaboratoryResultUpdateList?: TicketLaboratoryResult[]
    ticketLaboratoryResultDestroyList?: TicketLaboratoryResult[]
  }) {
    const ticketAction: Ticket[] = SocketService.getTicketAction({
      ticketId: data.ticketId,
    })
    ticketAction.forEach(async (ticket) => {
      if (!ticket.ticketLaboratoryList) ticket.ticketLaboratoryList = []
      if (!ticket.ticketLaboratoryGroupList) ticket.ticketLaboratoryGroupList = []
      if (!ticket.ticketLaboratoryResultList) ticket.ticketLaboratoryResultList = []

      if (data.ticketLaboratoryInsertList) {
        data.ticketLaboratoryInsertList.forEach((i) => {
          const indexInsert = ticket.ticketLaboratoryList!.findIndex((j) => {
            return i.id === j.id
          })
          if (indexInsert === -1) {
            const temp = TicketLaboratory.from(i)
            ticket.ticketLaboratoryList?.push(temp)
          }
        })
      }

      if (data.ticketLaboratoryUpdateList) {
        data.ticketLaboratoryUpdateList.forEach((i) => {
          const indexUpdate = ticket.ticketLaboratoryList!.findIndex((j) => {
            return i.id === j.id
          })
          if (indexUpdate !== -1) {
            const temp = TicketLaboratory.from(i)
            Object.assign(ticket.ticketLaboratoryList![indexUpdate], temp)
          }
        })
      }

      if (data.ticketLaboratoryDestroyList) {
        const tlDestroyIdList = data.ticketLaboratoryDestroyList.map((i) => i.id)
        ticket.ticketLaboratoryList = ticket.ticketLaboratoryList.filter((i) => {
          return !tlDestroyIdList.includes(i.id)
        })
      }

      if (data.ticketLaboratoryGroupInsertList) {
        data.ticketLaboratoryGroupInsertList.forEach((i) => {
          const indexInsert = ticket.ticketLaboratoryGroupList!.findIndex((j) => {
            return i.id === j.id
          })
          if (indexInsert === -1) {
            const temp = TicketLaboratoryGroup.from(i)
            ticket.ticketLaboratoryGroupList?.push(temp)
          }
        })
      }

      if (data.ticketLaboratoryGroupUpdate) {
        const indexUpdate = ticket.ticketLaboratoryGroupList.findIndex((i) => {
          return data.ticketLaboratoryGroupUpdate?.id === i.id
        })
        if (indexUpdate !== -1) {
          const temp = TicketLaboratoryGroup.from(data.ticketLaboratoryGroupUpdate)
          Object.assign(ticket.ticketLaboratoryGroupList[indexUpdate], temp)
        }
      }

      if (data.ticketLaboratoryGroupDestroy) {
        const indexDestroy = ticket.ticketLaboratoryGroupList.findIndex((i) => {
          return i.id === data.ticketLaboratoryGroupDestroy!.id
        })
        if (indexDestroy !== -1) {
          ticket.ticketLaboratoryGroupList?.splice(indexDestroy, 1)
        }
      }

      if (data.ticketLaboratoryResultInsertList) {
        data.ticketLaboratoryResultInsertList.forEach((i) => {
          const indexInsert = ticket.ticketLaboratoryResultList!.findIndex((j) => {
            return i.id === j.id
          })
          if (indexInsert === -1) {
            const temp = TicketLaboratoryResult.from(i)
            ticket.ticketLaboratoryResultList?.push(temp)
          }
        })
      }

      if (data.ticketLaboratoryResultUpdateList) {
        data.ticketLaboratoryResultUpdateList.forEach((i) => {
          const indexUpdate = ticket.ticketLaboratoryResultList!.findIndex((j) => {
            return i.id === j.id
          })
          if (indexUpdate !== -1) {
            const temp = TicketLaboratoryResult.from(i)
            Object.assign(ticket.ticketLaboratoryResultList![indexUpdate], temp)
          }
        })
      }

      if (data.ticketLaboratoryResultDestroyList) {
        const tlrDestroyIdList = data.ticketLaboratoryResultDestroyList.map((i) => i.id)
        ticket.ticketLaboratoryResultList = ticket.ticketLaboratoryResultList.filter((i) => {
          return !tlrDestroyIdList.includes(i.id)
        })
      }

      await ticket.refreshLaboratory()
    })

    const roomIdAction = [
      ...(data.ticketLaboratoryInsertList || []).map((i) => i.roomId),
      ...(data.ticketLaboratoryUpdateList || []).map((i) => i.roomId),
      ...(data.ticketLaboratoryDestroyList || []).map((i) => i.roomId),
      ...(data.ticketLaboratoryGroupInsertList || []).map((i) => i.roomId),
      data.ticketLaboratoryGroupUpdate ? data.ticketLaboratoryGroupUpdate.roomId : 0,
      data.ticketLaboratoryGroupDestroy ? data.ticketLaboratoryGroupDestroy.roomId : 0,
    ]
    await LaboratoryGroupService.getMap()
    roomIdAction.forEach((roomId) => {
      roomLaboratory.value[roomId] = new Date().toISOString()
    })
  }

  static async listenSocketTicketConsumableChange(data: {
    ticketId: number
    ticketProductDestroyList?: TicketProduct[]
    ticketProductUpsertList?: TicketProduct[]
    ticketProductReplaceList?: TicketProduct[]
  }) {
    const { ticketId } = data
    const ticketAction: Ticket[] = SocketService.getTicketAction({
      ticketId: data.ticketId,
    })

    ticketAction.forEach(async (ticket) => {
      if (!ticket.ticketProductConsumableList) return

      if (data.ticketProductUpsertList) {
        data.ticketProductUpsertList.forEach((i) => {
          const temp = TicketProduct.from(i)
          const index = (ticket.ticketProductConsumableList || []).findIndex((j) => {
            return i.id === j.id
          })
          if (index !== -1) {
            ticket.ticketProductConsumableList![index] = temp
          } else {
            ticket.ticketProductConsumableList!.push(temp)
          }
        })
      }

      if (data.ticketProductDestroyList) {
        const idDestroyList = data.ticketProductDestroyList.map((i) => i.id)
        ticket.ticketProductConsumableList = ticket.ticketProductConsumableList.filter((i) => {
          return !idDestroyList.includes(i.id)
        })
      }

      if (data?.ticketProductReplaceList) {
        ticket.ticketProductConsumableList = TicketProduct.fromList(data.ticketProductReplaceList)
      }
      await ticket.refreshProduct()
    })
  }

  static async listenSocketTicketPrescriptionChange(data: {
    ticketId: number
    ticketProductDestroyList?: TicketProduct[]
    ticketProductUpsertList?: TicketProduct[]
    ticketProductReplaceList?: TicketProduct[]
  }) {
    const { ticketId } = data
    const ticketAction: Ticket[] = SocketService.getTicketAction({
      ticketId: data.ticketId,
    })

    ticketAction.forEach(async (ticket) => {
      if (!ticket.ticketProductPrescriptionList) return

      if (data.ticketProductUpsertList) {
        data.ticketProductUpsertList.forEach((i) => {
          const temp = TicketProduct.from(i)
          const index = (ticket.ticketProductPrescriptionList || []).findIndex((j) => {
            return i.id === j.id
          })
          if (index !== -1) {
            ticket.ticketProductPrescriptionList![index] = temp
          } else {
            ticket.ticketProductPrescriptionList!.push(temp)
          }
        })
      }

      if (data.ticketProductDestroyList) {
        const idDestroyList = data.ticketProductDestroyList.map((i) => i.id)
        ticket.ticketProductPrescriptionList = ticket.ticketProductPrescriptionList.filter((i) => {
          return !idDestroyList.includes(i.id)
        })
      }

      if (data.ticketProductReplaceList) {
        ticket.ticketProductPrescriptionList = TicketProduct.fromList(data.ticketProductReplaceList)
      }
      await ticket.refreshProduct()
    })
  }

  static async listenTicketBatchListChange(data: {
    ticketId: number
    roomId: number
    ticketBatchDestroyList?: TicketBatch[]
    ticketBatchUpsertList?: TicketBatch[]
    ticketBatchReplaceList?: TicketBatch[]
  }) {
    const { ticketId } = data
    const ticketAction: Ticket[] = SocketService.getTicketAction({
      ticketId: data.ticketId,
    })

    ticketAction.forEach(async (ticket) => {
      ticket.ticketBatchList ||= []

      if (data.ticketBatchUpsertList) {
        data.ticketBatchUpsertList.forEach((i) => {
          const temp = TicketBatch.from(i)
          const index = (ticket.ticketBatchList || []).findIndex((j) => {
            return i.id === j.id
          })
          if (index !== -1) {
            ticket.ticketBatchList![index] = temp
          } else {
            ticket.ticketBatchList!.push(temp)
          }
        })
      }

      if (data.ticketBatchDestroyList) {
        const idDestroyList = data.ticketBatchDestroyList.map((i) => i.id)
        ticket.ticketBatchList = ticket.ticketBatchList.filter((i) => {
          return !idDestroyList.includes(i.id)
        })
      }

      if (data.ticketBatchReplaceList) {
        ticket.ticketBatchList = TicketBatch.fromList(data.ticketBatchReplaceList)
      }
      ticket.refreshTicketProductHasTicketBatchList()
    })
  }
}
