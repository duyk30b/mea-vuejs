import { MeService } from '../../modules/_me/me.service'
import { useMeStore } from '../../modules/_me/me.store'
import type { InteractType } from '../../modules/commission'
import { Customer } from '../../modules/customer'
import { Distributor, DistributorService } from '../../modules/distributor'
import { Organization } from '../../modules/organization'
import { Product } from '../../modules/product'
import { Ticket } from '../../modules/ticket'
import { TicketAttribute } from '../../modules/ticket-attribute'
import { TicketBatch } from '../../modules/ticket-batch'
import { ticketClinicPagination, ticketClinicRef } from '../../modules/ticket-clinic'
import { TicketLaboratory } from '../../modules/ticket-laboratory'
import { TicketLaboratoryGroup } from '../../modules/ticket-laboratory-group'
import { TicketLaboratoryResult } from '../../modules/ticket-laboratory-result'
import { TicketProcedure } from '../../modules/ticket-procedure'
import { TicketProduct } from '../../modules/ticket-product'
import { TicketRadiology } from '../../modules/ticket-radiology'
import { TicketUser } from '../../modules/ticket-user'
import { CustomerDB } from '../indexed-db/repository/customer.repository'
import { ProductDB } from '../indexed-db/repository/product.repository'

export class SocketService {
  static listenServerEmitDemo(data: any) {
    console.log('🚀 ~ file: socket.service.ts:3 ~ listenServerEmitDemo ~ data:', data)
  }

  static async listenOrganizationUpdate(data: { organization: Organization }) {
    const organization = Organization.from(data.organization)
    useMeStore().organization = organization
  }

  static async listenSettingReload(data: any) {
    await MeService.reloadSetting()
  }

  static async listenCustomerUpsert(data: { customer: any }) {
    const customer = Customer.from(data.customer)
    await CustomerDB.upsertOne(customer)

    if (ticketClinicRef.value.customerId === customer.id) {
      ticketClinicRef.value.customer = customer
    }
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

  static async listenProductUpsert(data: { product: any }) {
    const product = Product.from(data.product)
    await ProductDB.upsertOne(product)
  }

  static async listenProductListUpdate(data: { productList: any[] }) {
    const productList = Product.fromList(data.productList)
    await ProductDB.upsertMany(productList)
  }

  static getTicketAction(ticketId: number) {
    const ticketAction: Ticket[] = []
    const ticketFind = ticketClinicPagination.value.find((i) => i.id === ticketId)
    if (ticketFind) {
      ticketAction.push(ticketFind)
    }
    if (ticketClinicRef.value.id === ticketId) {
      ticketAction.push(ticketClinicRef.value)
    }
    return ticketAction
  }

  static async listenTicketClinicChange(data: {
    type: 'CREATE' | 'UPDATE' | 'DESTROY'
    ticket: any
  }) {
    const ticket = Ticket.from(data.ticket)
    if (ticketClinicRef.value.id === ticket.id) {
      Object.assign(ticketClinicRef.value, ticket)
    }

    const findIndex = ticketClinicPagination.value.findIndex((i) => i.id === ticket.id)
    if (data.type === 'CREATE' || data.type === 'UPDATE') {
      if (findIndex !== -1) {
        Object.assign(ticketClinicPagination.value[findIndex], ticket)
      } else {
        ticketClinicPagination.value.unshift(ticket)
      }
    }
    if (data.type === 'DESTROY') {
      if (findIndex !== -1) {
        ticketClinicPagination.value.splice(findIndex, 1)
      }
    }
  }

  static async listenTicketClinicUpdateTicketAttributeList(data: {
    ticketId: number
    ticketAttributeList: any[]
  }) {
    const ticketAction: Ticket[] = SocketService.getTicketAction(data.ticketId)
    ticketAction.forEach((ticket) => {
      ticket.ticketAttributeList = TicketAttribute.fromList(data.ticketAttributeList)
      ticket.ticketAttributeMap = TicketAttribute.basicMap(data.ticketAttributeList)
    })
  }

  static async listenTicketClinicChangeTicketUserList(data: {
    ticketId: number
    ticketUserDestroyList?: TicketUser[]
    ticketUserUpsertList?: TicketUser[]
    replace?: {
      interactType: InteractType
      ticketItemId: number // ticketItemId = 0 là thay thế toàn bộ interactType đó
      ticketUserList: TicketUser[]
    }
    replaceAll: {
      ticketUserList: TicketUser[]
    }
  }) {
    const ticketAction: Ticket[] = SocketService.getTicketAction(data.ticketId)
    ticketAction.forEach(async (ticket) => {
      if (!ticket.ticketUserList) return

      if (data.replace) {
        const ticketUserOtherList = ticket.ticketUserList.filter((i) => {
          if (i.interactType !== data.replace!.interactType) return true
          if (data.replace?.ticketItemId) {
            // ticketItemId = 0 là thay thế toàn bộ interactType đó nên ko filter
            if (i.ticketItemId !== data.replace!.ticketItemId) return true
          }
          return false
        })
        // let ticketUserActionList = ticket.ticketUserList.filter((i) => {
        //   if (i.interactType !== data.replace!.interactType) return false
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

  static async listenTicketClinicChangeTicketProcedureList(data: {
    ticketId: number
    ticketProcedureInsert?: TicketProcedure
    ticketProcedureUpdate?: TicketProcedure
    ticketProcedureDestroy?: TicketProcedure
    ticketProcedureList?: TicketProcedure[]
  }) {
    const ticketAction: Ticket[] = SocketService.getTicketAction(data.ticketId)
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

  static async listenTicketClinicChangeTicketRadiologyList(data: {
    ticketId: number
    ticketRadiologyInsert?: TicketRadiology
    ticketRadiologyUpdate?: TicketRadiology
    ticketRadiologyDestroy?: TicketRadiology
    ticketRadiologyList?: TicketRadiology[]
  }) {
    const ticketAction: Ticket[] = SocketService.getTicketAction(data.ticketId)
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
  }

  static async listenTicketClinicChangeLaboratory(data: {
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
    const ticketAction: Ticket[] = SocketService.getTicketAction(data.ticketId)
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

      if (data.ticketLaboratoryResultUpdateList) {
        const tlrDestroyIdList = data.ticketLaboratoryResultUpdateList.map((i) => i.id)
        ticket.ticketLaboratoryResultList = ticket.ticketLaboratoryResultList.filter((i) => {
          return !tlrDestroyIdList.includes(i.id)
        })
      }
      await ticket.refreshLaboratory()
    })
  }

  static async listenTicketClinicChangeConsumable(data: {
    ticketId: number
    ticketProductDestroyList?: TicketProduct[]
    ticketProductUpsertList?: TicketProduct[]
    ticketProductReplaceList?: TicketProduct[]
  }) {
    const { ticketId } = data
    const ticketAction: Ticket[] = SocketService.getTicketAction(ticketId)

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

  static async listenTicketClinicChangePrescription(data: {
    ticketId: number
    ticketProductDestroyList?: TicketProduct[]
    ticketProductUpsertList?: TicketProduct[]
    ticketProductReplaceList?: TicketProduct[]
  }) {
    const { ticketId } = data
    const ticketAction: Ticket[] = SocketService.getTicketAction(ticketId)

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

  static async listenTicketClinicChangeBatch(data: {
    ticketId: number
    ticketBatchDestroyList?: TicketBatch[]
    ticketBatchUpsertList?: TicketBatch[]
    ticketBatchReplaceList?: TicketBatch[]
  }) {
    const { ticketId } = data
    const ticketAction: Ticket[] = SocketService.getTicketAction(ticketId)

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
