import { Batch } from '@/modules/batch'
import { DiscountService, type Discount } from '@/modules/discount'
import { LaboratoryService, type Laboratory } from '@/modules/laboratory'
import { LaboratoryGroupService } from '@/modules/laboratory-group'
import { ProcedureService, type Procedure } from '@/modules/procedure'
import { RadiologyService, type Radiology } from '@/modules/radiology'
import { RoomService } from '@/modules/room'
import {
  roomDeliveryPagination,
  roomFinancePagination,
  roomLaboratory,
  roomRadiology,
  roomTicketPaginationMapRoomId,
  ticketRoomRef,
} from '@/modules/room/room.ref'
import { MeService } from '../../modules/_me/me.service'
import { Customer } from '../../modules/customer'
import { Distributor, DistributorService } from '../../modules/distributor'
import { Organization } from '../../modules/organization'
import { Position, PositionService, type PositionType } from '../../modules/position'
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
import { Image } from '@/modules/image/image.model'

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

  static getRoomPaginationAction() {
    return [
      roomFinancePagination.value || [],
      roomDeliveryPagination.value || [],
      [ticketRoomRef.value],
    ]
  }

  static async listenSocketTicketChange(data: {
    type: 'CREATE' | 'UPDATE' | 'DESTROY'
    ticket: any
  }) {
    if (data.type === 'CREATE' || data.type === 'UPDATE') {
      await SocketService.listenSocketTicketListChange({ ticketUpsertedList: [data.ticket] })
    }
    if (data.type === 'DESTROY') {
      await SocketService.listenSocketTicketListChange({ ticketDestroyedList: [data.ticket] })
    }
  }

  static async listenSocketTicketListChange(data: {
    ticketDestroyedList?: any[]
    ticketUpsertedList?: any[]
  }) {
    const roomPaginationList = SocketService.getRoomPaginationAction()

    if (data.ticketUpsertedList) {
      data.ticketUpsertedList?.forEach((ticketPlain) => {
        const ticket = Ticket.from(ticketPlain)

        roomPaginationList.forEach((roomPagination) => {
          const findIndex = roomPagination.findIndex((i) => i.id === ticket.id)

          if (findIndex !== -1) {
            Object.assign(roomPagination[findIndex], ticket)
          } else {
            roomPagination.unshift(ticket)
          }
        })

        Object.entries(roomTicketPaginationMapRoomId.value).forEach((entries) => {
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

    if (data.ticketDestroyedList) {
      data.ticketDestroyedList.forEach((ticket) => {
        roomPaginationList.forEach((roomPagination) => {
          const findIndex = roomPagination.findIndex((i) => i.id === ticket.id)
          if (findIndex !== -1) {
            roomPagination.splice(findIndex, 1)
          }
        })

        Object.entries(roomTicketPaginationMapRoomId.value).forEach((entries) => {
          const ticketPagination = entries[1]
          const findIndex = ticketPagination.findIndex((i) => i.id === ticket.id)
          if (findIndex !== -1) {
            ticketPagination.splice(findIndex, 1)
          }
        })
      })
    }
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

  static async listenSocketTicketProcedureListChange(data: {
    ticketId: number
    ticketProcedureUpsertedList?: TicketProcedure[]
    ticketProcedureDestroyedList?: TicketProcedure[]
    ticketUserDestroyedList?: TicketUser[]
    ticketUserUpsertedList?: TicketUser[]
    imageDestroyedList?: Image[]
    imageUpsertedList?: Image[]
  }) {
    await SocketService.listenSocketTicketUserListChange({
      ticketId: data.ticketId,
      ticketUserDestroyedList: data.ticketUserDestroyedList,
      ticketUserUpsertedList: data.ticketUserUpsertedList,
    })

    await SocketService.listenTicketChangeImage({
      ticketId: data.ticketId,
      imageDestroyedList: data.imageDestroyedList,
      imageUpsertedList: data.imageUpsertedList,
    })

    const ticketActionList: Ticket[] = [
      ticketRoomRef.value,
      ...Object.values(roomTicketPaginationMapRoomId.value).flat(),
      ...roomFinancePagination.value,
      ...roomDeliveryPagination.value,
    ]

    for (let i = 0; i < ticketActionList.length; i++) {
      const ticket = ticketActionList[i]
      if (ticket.id !== data.ticketId) continue
      if (!ticket.ticketProcedureList) continue

      if (data.ticketProcedureDestroyedList) {
        const idDestroyList = data.ticketProcedureDestroyedList.map((i) => i.id)
        ticket.ticketProcedureList = ticket.ticketProcedureList.filter((i) => {
          return !idDestroyList.includes(i.id)
        })
      }

      if (data.ticketProcedureUpsertedList) {
        data.ticketProcedureUpsertedList.forEach((i) => {
          const temp = TicketProcedure.from(i)
          const index = ticket.ticketProcedureList!.findIndex((j) => {
            return i.id === j.id
          })
          if (index !== -1) {
            Object.assign(ticket.ticketProcedureList![index], temp)
          } else {
            ticket.ticketProcedureList!.push(temp)
          }
        })
      }
      ticket.ticketProcedureList.sort((a, b) => (a.priority < b.priority ? -1 : 1))

      await ticket.refreshProcedure()
    }
  }

  static async listenSocketTicketRadiologyListChange(data: {
    ticketId: number
    ticketRadiologyUpsertedList?: TicketRadiology[]
    ticketRadiologyDestroyedList?: TicketRadiology[]
    ticketUserDestroyedList?: TicketUser[]
    ticketUserUpsertedList?: TicketUser[]
    imageDestroyedList?: Image[]
    imageUpsertedList?: Image[]
  }) {
    await SocketService.listenSocketTicketUserListChange({
      ticketId: data.ticketId,
      ticketUserDestroyedList: data.ticketUserDestroyedList,
      ticketUserUpsertedList: data.ticketUserUpsertedList,
    })

    await SocketService.listenTicketChangeImage({
      ticketId: data.ticketId,
      imageDestroyedList: data.imageDestroyedList,
      imageUpsertedList: data.imageUpsertedList,
    })

    const ticketAction: Ticket[] = SocketService.getTicketAction({
      ticketId: data.ticketId,
    })
    for (let i = 0; i < ticketAction.length; i++) {
      const ticket = ticketAction[i]
      if (ticket.id !== data.ticketId) continue
      if (!ticket.ticketRadiologyList) continue

      if (data.ticketRadiologyUpsertedList) {
        data.ticketRadiologyUpsertedList?.forEach((i) => {
          const temp = TicketRadiology.from(i)
          const index = ticket.ticketRadiologyList!.findIndex((j) => {
            return i.id === j.id
          })
          if (index !== -1) {
            ticket.ticketRadiologyList![index] = temp
          } else {
            ticket.ticketRadiologyList!.push(temp)
          }
        })
      }

      if (data.ticketRadiologyDestroyedList) {
        const idDestroyList = data.ticketRadiologyDestroyedList.map((i) => i.id)
        ticket.ticketRadiologyList = ticket.ticketRadiologyList.filter((i) => {
          return !idDestroyList.includes(i.id)
        })
      }

      await ticket.refreshRadiology()
    }
    const ticketRadiologyActionList = [
      ...(data.ticketRadiologyUpsertedList || []),
      ...(data.ticketRadiologyDestroyedList || []),
    ]
    ticketRadiologyActionList.forEach((tr) => {
      roomRadiology.value[tr.roomId] = new Date().toISOString()
    })
  }

  static async listenSocketTicketLaboratoryListChange(data: {
    ticketId: number
    ticketLaboratoryUpsertedList?: TicketLaboratory[]
    ticketLaboratoryDestroyedList?: TicketLaboratory[]
    ticketLaboratoryGroupUpsertedList?: TicketLaboratoryGroup[]
    ticketLaboratoryGroupDestroyedList?: TicketLaboratoryGroup[]
    ticketLaboratoryResultUpsertedList?: TicketLaboratoryResult[]
    ticketLaboratoryResultDestroyedList?: TicketLaboratoryResult[]
  }) {
    const ticketAction: Ticket[] = SocketService.getTicketAction({
      ticketId: data.ticketId,
    })
    ticketAction.forEach(async (ticket) => {
      if (ticket.id !== data.ticketId) return
      if (!ticket.ticketLaboratoryList) ticket.ticketLaboratoryList = []
      if (!ticket.ticketLaboratoryGroupList) ticket.ticketLaboratoryGroupList = []
      if (!ticket.ticketLaboratoryResultList) ticket.ticketLaboratoryResultList = []

      if (data.ticketLaboratoryUpsertedList) {
        data.ticketLaboratoryUpsertedList.forEach((i) => {
          const temp = TicketLaboratory.from(i)
          const index = ticket.ticketLaboratoryList!.findIndex((j) => {
            return i.id === j.id
          })
          if (index !== -1) {
            ticket.ticketLaboratoryList![index] = temp
          } else {
            ticket.ticketLaboratoryList!.push(temp)
          }
        })
      }

      if (data.ticketLaboratoryDestroyedList) {
        const idDestroyList = data.ticketLaboratoryDestroyedList.map((i) => i.id)
        ticket.ticketLaboratoryList = ticket.ticketLaboratoryList.filter((i) => {
          return !idDestroyList.includes(i.id)
        })
      }

      if (data.ticketLaboratoryGroupUpsertedList) {
        data.ticketLaboratoryGroupUpsertedList.forEach((i) => {
          const temp = TicketLaboratoryGroup.from(i)
          const index = ticket.ticketLaboratoryGroupList!.findIndex((j) => {
            return i.id === j.id
          })
          if (index !== -1) {
            ticket.ticketLaboratoryGroupList![index] = temp
          } else {
            ticket.ticketLaboratoryGroupList!.push(temp)
          }
        })
      }

      if (data.ticketLaboratoryGroupDestroyedList) {
        const idDestroyList = data.ticketLaboratoryGroupDestroyedList.map((i) => i.id)
        ticket.ticketLaboratoryGroupList = ticket.ticketLaboratoryGroupList.filter((i) => {
          return !idDestroyList.includes(i.id)
        })
      }

      if (data.ticketLaboratoryResultUpsertedList) {
        data.ticketLaboratoryResultUpsertedList.forEach((i) => {
          const temp = TicketLaboratoryResult.from(i)
          const index = ticket.ticketLaboratoryResultList!.findIndex((j) => {
            return i.id === j.id
          })
          if (index !== -1) {
            ticket.ticketLaboratoryResultList![index] = temp
          } else {
            ticket.ticketLaboratoryResultList!.push(temp)
          }
        })
      }

      if (data.ticketLaboratoryResultDestroyedList) {
        const idDestroyList = data.ticketLaboratoryResultDestroyedList.map((i) => i.id)
        ticket.ticketLaboratoryResultList = ticket.ticketLaboratoryResultList.filter((i) => {
          return !idDestroyList.includes(i.id)
        })
      }

      await ticket.refreshLaboratory()
    })

    const roomIdAction = [
      ...(data.ticketLaboratoryUpsertedList || []).map((i) => i.roomId),
      ...(data.ticketLaboratoryDestroyedList || []).map((i) => i.roomId),
      ...(data.ticketLaboratoryGroupUpsertedList || []).map((i) => i.roomId),
      ...(data.ticketLaboratoryGroupDestroyedList || []).map((i) => i.roomId),
    ]
    await LaboratoryGroupService.getMap()
    roomIdAction.forEach((roomId) => {
      roomLaboratory.value[roomId] = new Date().toISOString()
    })
  }

  static async listenSocketTicketConsumableChange(data: {
    ticketId: number
    ticketProductDestroyedList?: TicketProduct[]
    ticketProductUpsertedList?: TicketProduct[]
  }) {
    const { ticketId } = data
    const ticketAction: Ticket[] = SocketService.getTicketAction({
      ticketId: data.ticketId,
    })

    ticketAction.forEach(async (ticket) => {
      if (ticket.id !== data.ticketId) return
      if (!ticket.ticketProductConsumableList) return

      if (data.ticketProductUpsertedList) {
        data.ticketProductUpsertedList.forEach((i) => {
          const temp = TicketProduct.from(i)
          const index = ticket.ticketProductConsumableList!.findIndex((j) => {
            return i.id === j.id
          })
          if (index !== -1) {
            ticket.ticketProductConsumableList![index] = temp
          } else {
            ticket.ticketProductConsumableList!.push(temp)
          }
        })
      }

      if (data.ticketProductDestroyedList) {
        const idDestroyList = data.ticketProductDestroyedList.map((i) => i.id)
        ticket.ticketProductConsumableList = ticket.ticketProductConsumableList.filter((i) => {
          return !idDestroyList.includes(i.id)
        })
      }

      ticket.ticketProductConsumableList.sort((a, b) => (a.priority < b.priority ? -1 : 1))
      await ticket.refreshProduct()
    })
  }

  static async listenSocketTicketPrescriptionChange(data: {
    ticketId: number
    ticketProductDestroyedList?: TicketProduct[]
    ticketProductUpsertedList?: TicketProduct[]
  }) {
    const { ticketId } = data
    const ticketAction: Ticket[] = SocketService.getTicketAction({
      ticketId: data.ticketId,
    })

    ticketAction.forEach(async (ticket) => {
      if (ticket.id !== data.ticketId) return
      if (!ticket.ticketProductPrescriptionList) return

      if (data.ticketProductUpsertedList) {
        data.ticketProductUpsertedList.forEach((i) => {
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

      if (data.ticketProductDestroyedList) {
        const idDestroyList = data.ticketProductDestroyedList.map((i) => i.id)
        ticket.ticketProductPrescriptionList = ticket.ticketProductPrescriptionList.filter((i) => {
          return !idDestroyList.includes(i.id)
        })
      }

      ticket.ticketProductPrescriptionList.sort((a, b) => (a.priority < b.priority ? -1 : 1))
      await ticket.refreshProduct()
    })
  }

  static async listenTicketBatchListChange(data: {
    ticketId: number
    roomId: number
    ticketBatchDestroyedList?: TicketBatch[]
    ticketBatchUpsertedList?: TicketBatch[]
  }) {
    const { ticketId } = data
    const ticketAction: Ticket[] = SocketService.getTicketAction({
      ticketId: data.ticketId,
    })

    ticketAction.forEach(async (ticket) => {
      if (ticket.id !== data.ticketId) return
      if (!ticket.ticketBatchList) return

      if (data.ticketBatchUpsertedList) {
        data.ticketBatchUpsertedList.forEach((i) => {
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

      if (data.ticketBatchDestroyedList) {
        const idDestroyList = data.ticketBatchDestroyedList.map((i) => i.id)
        ticket.ticketBatchList = ticket.ticketBatchList.filter((i) => {
          return !idDestroyList.includes(i.id)
        })
      }
      ticket.refreshTicketProductHasTicketBatchList()
    })
  }

  static async listenSocketTicketUserListChange(data: {
    ticketId: number
    ticketUserDestroyedList?: TicketUser[]
    ticketUserUpsertedList?: TicketUser[]
  }) {
    const ticketActionList: Ticket[] = [
      ticketRoomRef.value,
      ...Object.values(roomTicketPaginationMapRoomId.value).flat(),
      ...roomFinancePagination.value,
      ...roomDeliveryPagination.value,
    ]

    for (let i = 0; i < ticketActionList.length; i++) {
      const ticketAction = ticketActionList[i]
      if (ticketAction.id !== data.ticketId) continue
      if (!ticketAction.ticketUserList) continue

      // Destroy phải  xử lý trước
      if (data.ticketUserDestroyedList) {
        const idDestroyList = data.ticketUserDestroyedList.map((i) => i.id)
        ticketAction.ticketUserList = ticketAction.ticketUserList.filter((i) => {
          return !idDestroyList.includes(i.id)
        })
      }

      if (data.ticketUserUpsertedList) {
        data.ticketUserUpsertedList.forEach((i) => {
          const temp = TicketUser.from(i)
          const index = ticketAction.ticketUserList!.findIndex((j) => {
            return i.id === j.id
          })
          if (index !== -1) {
            ticketAction.ticketUserList![index] = temp
          } else {
            ticketAction.ticketUserList!.push(temp)
          }
        })
      }

      ticketAction.ticketUserList.sort((a, b) => {
        if (a.positionType < b.positionType) return -1
        if (a.positionType > b.positionType) return 1
        if (a.ticketItemId < b.ticketItemId) return -1
        if (a.ticketItemId > b.ticketItemId) return 1
        if (a.ticketItemChildId < b.ticketItemChildId) return -1
        if (a.ticketItemChildId > b.ticketItemChildId) return 1
        if (a.roleId < b.roleId) return -1
        if (a.roleId > b.roleId) return 1
        return -1
      })

      ticketAction.refreshTicketUserTree()
      await ticketAction.refreshUserAndRole()
    }
  }

  static async listenTicketChangeImage(data: {
    ticketId: number
    imageDestroyedList?: Image[]
    imageUpsertedList?: Image[]
  }) {
    const ticketActionList: Ticket[] = [
      ticketRoomRef.value,
      ...Object.values(roomTicketPaginationMapRoomId.value).flat(),
      ...roomFinancePagination.value,
      ...roomDeliveryPagination.value,
    ]

    ticketActionList.forEach(async (ticketAction) => {
      if (ticketAction.id !== data.ticketId) return
      if (!ticketAction.imageList) return

      // Destroy phải  xử lý trước
      if (data.imageDestroyedList) {
        const idDestroyList = data.imageDestroyedList.map((i) => i.id)
        ticketAction.imageList = ticketAction.imageList.filter((i) => {
          return !idDestroyList.includes(i.id)
        })
      }

      if (data.imageUpsertedList) {
        data.imageUpsertedList.forEach((i) => {
          const temp = Image.from(i)
          const index = ticketAction.imageList!.findIndex((j) => {
            return i.id === j.id
          })
          if (index !== -1) {
            ticketAction.imageList![index] = temp
          } else {
            ticketAction.imageList!.push(temp)
          }
        })
      }

      ticketAction.refreshImageMap()
    })
  }
}
