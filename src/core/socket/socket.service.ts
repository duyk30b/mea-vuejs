import { MeService } from '../../modules/_me/me.service'
import { useMeStore } from '../../modules/_me/me.store'
import { Batch } from '../../modules/batch'
import { InteractType } from '../../modules/commission'
import { Customer } from '../../modules/customer'
import { Distributor, DistributorService } from '../../modules/distributor'
import { Organization } from '../../modules/organization'
import { Product } from '../../modules/product'
import { Ticket } from '../../modules/ticket'
import { TicketAttribute } from '../../modules/ticket-attribute'
import { ticketClinicPagination, ticketClinicRef } from '../../modules/ticket-clinic'
import { TicketLaboratory } from '../../modules/ticket-laboratory'
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

  static async listenBatchUpsert(data: { batch: any }) {
    const batch = Batch.from(data.batch)
    await BatchDB.upsertOne(batch)
  }

  static async listenBatchListUpdate(data: { batchList: any[] }) {
    const batchList = Batch.fromList(data.batchList)
    await BatchDB.upsertMany(batchList)
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
    interactType: InteractType
    ticketItemId: number
    ticketUserReplaceList?: TicketUser[]
    ticketUserDestroyList?: TicketUser[]
    ticketUserUpdateList?: TicketUser[]
    ticketUserInsertList?: TicketUser[]
  }) {
    const ticketAction: Ticket[] = SocketService.getTicketAction(data.ticketId)
    ticketAction.forEach((ticket) => {
      if (!ticket.ticketUserList) ticket.ticketUserList = []

      const ticketUserOtherList = ticket.ticketUserList.filter((i) => {
        if (i.interactType !== data.interactType) return true
        if (i.ticketItemId !== data.ticketItemId) return true
        return false
      })

      let ticketUserActionList = ticket.ticketUserList.filter((i) => {
        if (i.interactType !== data.interactType) return false
        if (i.ticketItemId !== data.ticketItemId) return false
        return true
      })

      if (data.ticketUserReplaceList) {
        ticketUserActionList = TicketUser.fromList(data.ticketUserReplaceList)
      }
      if (data.ticketUserInsertList) {
        ticketUserActionList = ticketUserActionList.concat(
          TicketUser.fromList(data.ticketUserInsertList)
        )
      }
      if (data.ticketUserUpdateList) {
        const roleIdList = data.ticketUserUpdateList.map((i) => i.roleId)
        ticketUserActionList = ticketUserActionList
          .filter((i) => !roleIdList.includes(i.roleId))
          .concat(TicketUser.fromList(data.ticketUserUpdateList))
      }
      if (data.ticketUserDestroyList) {
        const roleIdList = data.ticketUserDestroyList.map((i) => i.roleId)
        ticketUserActionList = ticketUserActionList.filter((i) => !roleIdList.includes(i.roleId))
      }

      ticket.ticketUserList = ticketUserOtherList.concat(ticketUserActionList)
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
    ticketAction.forEach((ticket) => {
      if (data.ticketProcedureInsert) {
        const indexInsert = (ticket.ticketProcedureList || []).findIndex((i) => {
          return data.ticketProcedureInsert?.id === i.id
        })
        if (indexInsert === -1) {
          ticket.ticketProcedureList?.push(TicketProcedure.from(data.ticketProcedureInsert))
        }
      }
      if (data.ticketProcedureUpdate) {
        const findExist = (ticket.ticketProcedureList || []).findIndex((i) => {
          return data.ticketProcedureInsert?.id === i.id
        })
        if (findExist) {
          Object.assign(findExist, TicketProcedure.from(data.ticketProcedureUpdate))
        }
      }
      if (data.ticketProcedureDestroy) {
        const indexDestroy = (ticket.ticketProcedureList || []).findIndex((i) => {
          return i.id === data.ticketProcedureDestroy!.id
        })
        if (indexDestroy !== -1) {
          ticket.ticketProcedureList?.splice(indexDestroy, 1)
        }
      }
      if (data.ticketProcedureList) {
        ticket.ticketProcedureList = TicketProcedure.fromList(data.ticketProcedureList)
      }
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
    ticketAction.forEach((ticket) => {
      if (data.ticketRadiologyInsert) {
        const indexInsert = (ticket.ticketRadiologyList || []).findIndex((i) => {
          return data.ticketRadiologyInsert?.id === i.id
        })
        if (indexInsert === -1) {
          ticket.ticketRadiologyList?.push(TicketRadiology.from(data.ticketRadiologyInsert))
        }
      }
      if (data.ticketRadiologyUpdate) {
        const findExist = (ticket.ticketRadiologyList || []).findIndex((i) => {
          return data.ticketRadiologyInsert?.id === i.id
        })
        if (findExist) {
          Object.assign(findExist, TicketRadiology.from(data.ticketRadiologyUpdate))
        }
      }
      if (data.ticketRadiologyDestroy) {
        const indexDestroy = (ticket.ticketRadiologyList || []).findIndex((i) => {
          return i.id === data.ticketRadiologyDestroy!.id
        })
        if (indexDestroy !== -1) {
          ticket.ticketRadiologyList?.splice(indexDestroy, 1)
        }
      }
      if (data.ticketRadiologyList) {
        ticket.ticketRadiologyList = TicketRadiology.fromList(data.ticketRadiologyList)
      }
    })
  }

  static async listenTicketClinicUpdateTicketProductConsumableList(data: {
    ticketId: number
    ticketProductConsumableList: any[]
  }) {
    const ticketFind = ticketClinicPagination.value.find((i) => i.id === data.ticketId)
    if (ticketFind) {
      ticketFind.ticketProductConsumableList = TicketProduct.fromList(
        data.ticketProductConsumableList
      )
    }
    if (ticketClinicRef.value.id === data.ticketId) {
      ticketClinicRef.value.ticketProductConsumableList = TicketProduct.fromList(
        data.ticketProductConsumableList
      )
    }
  }

  static async listenTicketClinicUpdateTicketProductPrescriptionList(data: {
    ticketId: number
    ticketProductPrescriptionList: any[]
  }) {
    const ticketFind = ticketClinicPagination.value.find((i) => i.id === data.ticketId)
    if (ticketFind) {
      ticketFind.ticketProductPrescriptionList = TicketProduct.fromList(
        data.ticketProductPrescriptionList
      )
    }
    if (ticketClinicRef.value.id === data.ticketId) {
      ticketClinicRef.value.ticketProductPrescriptionList = TicketProduct.fromList(
        data.ticketProductPrescriptionList
      )
    }
  }

  static async listenTicketClinicUpdateTicketLaboratoryList(data: {
    ticketId: number
    ticketLaboratoryList: any[]
  }) {
    const ticketFind = ticketClinicPagination.value.find((i) => i.id === data.ticketId)
    if (ticketFind) {
      ticketFind.ticketLaboratoryList = TicketLaboratory.fromList(data.ticketLaboratoryList)
    }
    if (ticketClinicRef.value.id === data.ticketId) {
      ticketClinicRef.value.ticketLaboratoryList = TicketLaboratory.fromList(
        data.ticketLaboratoryList
      )
    }
  }

  static async listenTicketClinicUpdateTicketLaboratoryResult(data: {
    ticketId: number
    ticketLaboratory: any
  }) {
    const ticketFind = ticketClinicPagination.value.find((i) => i.id === data.ticketId)
    if (ticketFind) {
      const ticketLaboratoryFind = (ticketFind.ticketLaboratoryList || []).find((i) => {
        return i.id === data.ticketLaboratory.id
      })
      if (ticketLaboratoryFind) {
        Object.assign(ticketLaboratoryFind, TicketLaboratory.from(data.ticketLaboratory))
      }
    }

    if (ticketClinicRef.value.id === data.ticketId) {
      ticketClinicRef.value.ticketLaboratoryList ||= []
      const ticketLaboratoryFind = ticketClinicRef.value.ticketLaboratoryList.find((i) => {
        return i.id === data.ticketLaboratory.id
      })
      if (ticketLaboratoryFind) {
        Object.assign(ticketLaboratoryFind, TicketLaboratory.from(data.ticketLaboratory))
      } else {
        ticketClinicRef.value.ticketLaboratoryList.push(
          TicketLaboratory.from(data.ticketLaboratory)
        )
      }
    }
  }
}
