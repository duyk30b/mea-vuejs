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

  static getRoomPaginationAction() {
    return [
      roomReceptionPagination.value || [],
      roomFinancePagination.value || [],
      roomDeliveryPagination.value || [],
      [ticketRoomRef.value],
    ]
  }

  static async listenSocketTicketChange(data: {
    type: 'CREATE' | 'UPDATE' | 'DESTROY'
    ticket: any
  }) {
    const ticket = Ticket.from(data.ticket)

    const roomPaginationList = SocketService.getRoomPaginationAction()
    roomPaginationList.forEach((roomPagination) => {
      const findIndex = roomPagination.findIndex((i) => i.id === ticket.id)
      if (data.type === 'CREATE' || data.type === 'UPDATE') {
        if (findIndex !== -1) {
          Object.assign(roomPagination[findIndex], ticket)
        } else {
          roomPagination.unshift(ticket)
        }
      }
      if (data.type === 'DESTROY') {
        if (findIndex !== -1) {
          roomPagination.splice(findIndex, 1)
        }
      }
    })

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

    if (data.ticketDestroyedList) {
      data.ticketDestroyedList.forEach((ticket) => {
        roomPaginationList.forEach((roomPagination) => {
          const findIndex = roomPagination.findIndex((i) => i.id === ticket.id)
          if (findIndex !== -1) {
            roomPagination.splice(findIndex, 1)
          }
        })

        Object.entries(roomTicketPagination.value).forEach((entries) => {
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
    ticketProcedureUpsertList?: TicketProcedure[]
    ticketProcedureDestroyList?: TicketProcedure[]
    ticketProcedureReplaceAll?: TicketProcedure[]
  }) {
    const ticketAction: Ticket[] = SocketService.getTicketAction({
      ticketId: data.ticketId,
    })
    ticketAction.forEach(async (ticket) => {
      if (!ticket.ticketProcedureList) return

      if (data.ticketProcedureUpsertList) {
        data.ticketProcedureUpsertList.forEach((i) => {
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

      if (data.ticketProcedureDestroyList) {
        const idDestroyList = data.ticketProcedureDestroyList.map((i) => i.id)
        ticket.ticketProcedureList = ticket.ticketProcedureList.filter((i) => {
          return !idDestroyList.includes(i.id)
        })
      }

      if (data.ticketProcedureReplaceAll) {
        ticket.ticketProcedureList = TicketProcedure.fromList(data.ticketProcedureReplaceAll)
      }

      await ticket.refreshProcedure()
    })
  }

  static async listenSocketTicketRadiologyListChange(data: {
    ticketId: number
    ticketRadiologyUpsertList?: TicketRadiology[]
    ticketRadiologyDestroyList?: TicketRadiology[]
    ticketRadiologyReplaceAll?: TicketRadiology[]
  }) {
    const ticketAction: Ticket[] = SocketService.getTicketAction({
      ticketId: data.ticketId,
    })
    ticketAction.forEach(async (ticket) => {
      if (!ticket.ticketRadiologyList) return

      if (data.ticketRadiologyUpsertList) {
        data.ticketRadiologyUpsertList?.forEach((i) => {
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

      if (data.ticketRadiologyDestroyList) {
        const idDestroyList = data.ticketRadiologyDestroyList.map((i) => i.id)
        ticket.ticketRadiologyList = ticket.ticketRadiologyList.filter((i) => {
          return !idDestroyList.includes(i.id)
        })
      }
      if (data.ticketRadiologyReplaceAll) {
        ticket.ticketRadiologyList = TicketRadiology.fromList(data.ticketRadiologyReplaceAll)
      }

      await ticket.refreshRadiology()
    })
    const ticketRadiologyActionList = [
      ...(data.ticketRadiologyUpsertList || []),
      ...(data.ticketRadiologyDestroyList || []),
      ...(data.ticketRadiologyReplaceAll || []),
    ]
    ticketRadiologyActionList.forEach((tr) => {
      roomRadiology.value[tr.roomId] = new Date().toISOString()
    })
  }

  static async listenSocketTicketLaboratoryListChange(data: {
    ticketId: number
    ticketLaboratoryUpsertList?: TicketLaboratory[]
    ticketLaboratoryDestroyList?: TicketLaboratory[]
    ticketLaboratoryGroupUpsertList?: TicketLaboratoryGroup[]
    ticketLaboratoryGroupDestroyList?: TicketLaboratoryGroup[]
    ticketLaboratoryResultUpsertList?: TicketLaboratoryResult[]
    ticketLaboratoryResultDestroyList?: TicketLaboratoryResult[]
  }) {
    const ticketAction: Ticket[] = SocketService.getTicketAction({
      ticketId: data.ticketId,
    })
    ticketAction.forEach(async (ticket) => {
      if (!ticket.ticketLaboratoryList) ticket.ticketLaboratoryList = []
      if (!ticket.ticketLaboratoryGroupList) ticket.ticketLaboratoryGroupList = []
      if (!ticket.ticketLaboratoryResultList) ticket.ticketLaboratoryResultList = []

      if (data.ticketLaboratoryUpsertList) {
        data.ticketLaboratoryUpsertList.forEach((i) => {
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

      if (data.ticketLaboratoryDestroyList) {
        const idDestroyList = data.ticketLaboratoryDestroyList.map((i) => i.id)
        ticket.ticketLaboratoryList = ticket.ticketLaboratoryList.filter((i) => {
          return !idDestroyList.includes(i.id)
        })
      }

      if (data.ticketLaboratoryGroupUpsertList) {
        data.ticketLaboratoryGroupUpsertList.forEach((i) => {
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

      if (data.ticketLaboratoryGroupDestroyList) {
        const idDestroyList = data.ticketLaboratoryGroupDestroyList.map((i) => i.id)
        ticket.ticketLaboratoryGroupList = ticket.ticketLaboratoryGroupList.filter((i) => {
          return !idDestroyList.includes(i.id)
        })
      }

      if (data.ticketLaboratoryResultUpsertList) {
        data.ticketLaboratoryResultUpsertList.forEach((i) => {
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

      if (data.ticketLaboratoryResultDestroyList) {
        const idDestroyList = data.ticketLaboratoryResultDestroyList.map((i) => i.id)
        ticket.ticketLaboratoryResultList = ticket.ticketLaboratoryResultList.filter((i) => {
          return !idDestroyList.includes(i.id)
        })
      }

      await ticket.refreshLaboratory()
    })

    const roomIdAction = [
      ...(data.ticketLaboratoryUpsertList || []).map((i) => i.roomId),
      ...(data.ticketLaboratoryDestroyList || []).map((i) => i.roomId),
      ...(data.ticketLaboratoryGroupUpsertList || []).map((i) => i.roomId),
      ...(data.ticketLaboratoryGroupDestroyList || []).map((i) => i.roomId),
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
