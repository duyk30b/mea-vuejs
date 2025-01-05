import { MeService } from '../../modules/_me/me.service'
import { useMeStore } from '../../modules/_me/me.store'
import { Batch } from '../../modules/batch'
import { Customer } from '../../modules/customer'
import { Distributor, DistributorService } from '../../modules/distributor'
import { Organization } from '../../modules/organization'
import { Product } from '../../modules/product'
import { Ticket } from '../../modules/ticket'
import { TicketAttribute } from '../../modules/ticket-attribute'
import { ticketClinicList, ticketClinicRef } from '../../modules/ticket-clinic'
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

  static async listenTicketClinicCreate(data: { ticket: any }) {
    const ticket = Ticket.from(data.ticket)

    const ticketFind = ticketClinicList.value.find((i) => i.id === ticket.id)
    if (ticketFind) {
      Object.assign(ticketFind, ticket)
    } else {
      ticketClinicList.value.unshift(ticket)
    }

    if (ticket.customer) {
      await CustomerDB.upsertOne(ticket.customer)
    }
  }

  static async listenTicketClinicDestroy(data: { ticketId: any }) {
    const findIndex = ticketClinicList.value.findIndex((i) => i.id === data.ticketId)
    if (findIndex !== -1) {
      ticketClinicList.value.splice(findIndex, 1)
    }
  }

  static async listenTicketClinicUpdate(data: { ticket: any }) {
    const ticket = Ticket.from(data.ticket)
    const ticketFind = ticketClinicList.value.find((i) => i.id === ticket.id)
    if (ticketFind) {
      Object.assign(ticketFind, ticket)
    }
    if (ticketClinicRef.value.id === ticket.id) {
      Object.assign(ticketClinicRef.value, ticket)
    }
  }

  static async listenTicketClinicUpdateTicketAttributeList(data: {
    ticketId: number
    ticketAttributeList: any[]
  }) {
    const ticketFind = ticketClinicList.value.find((i) => i.id === data.ticketId)
    if (ticketFind) {
      ticketFind.ticketAttributeList = TicketAttribute.fromList(data.ticketAttributeList)
      ticketFind.ticketAttributeMap = TicketAttribute.basicMap(data.ticketAttributeList)
    }
    if (ticketClinicRef.value.id === data.ticketId) {
      ticketClinicRef.value.ticketAttributeList = TicketAttribute.fromList(data.ticketAttributeList)
      ticketClinicRef.value.ticketAttributeMap = TicketAttribute.basicMap(data.ticketAttributeList)
    }
  }

  static async listenTicketClinicAddTicketProcedure(data: {
    ticketId: number
    ticketProcedure: any
  }) {
    const ticketFind = ticketClinicList.value.find((i) => i.id === data.ticketId)
    if (ticketFind) {
      const ticketProcedureFind = (ticketFind.ticketProcedureList || []).find((i) => {
        return i.id === data.ticketProcedure.id
      })
      if (!ticketProcedureFind) {
        ticketFind.ticketProcedureList?.push(TicketProcedure.from(data.ticketProcedure))
      }
    }
    if (ticketClinicRef.value.id === data.ticketId) {
      const ticketProcedureFind = (ticketClinicRef.value.ticketProcedureList || []).find((i) => {
        return i.id === data.ticketProcedure.id
      })
      if (!ticketProcedureFind) {
        ticketClinicRef.value.ticketProcedureList?.push(TicketProcedure.from(data.ticketProcedure))
      }
    }
  }

  static getTicketAction(ticketId: number) {
    const ticketAction: Ticket[] = []
    const ticketFind = ticketClinicList.value.find((i) => i.id === ticketId)
    if (ticketFind) {
      ticketAction.push(ticketFind)
    }
    if (ticketClinicRef.value.id === ticketId) {
      ticketAction.push(ticketClinicRef.value)
    }
    return ticketAction
  }

  static async listenTicketClinicChangeTicketProcedureList(data: {
    ticketId: number
    ticketProcedureInsert?: TicketProcedure
    ticketProcedureUpdate?: TicketProcedure
    ticketProcedureDestroy?: TicketProcedure
    ticketProcedureUpdateList?: TicketProcedure[]
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
      if (data.ticketProcedureUpdateList) {
        data.ticketProcedureUpdateList.forEach((i) => {
          const findExist = ticket.ticketProcedureList?.find((j) => j.id === i.id)
          if (findExist) {
            Object.assign(findExist, i)
          }
        })
      }
      if (data.ticketProcedureList) {
        ticket.ticketProcedureList = TicketProcedure.fromList(data.ticketProcedureList)
      }
    })
  }

  static async listenTicketClinicChangeTicketUserList(data: {
    ticketId: number
    ticketUserInsertList?: TicketUser[]
    ticketUserUpdateList?: TicketUser[]
    ticketUserDestroyList?: TicketUser[]
  }) {
    const ticketAction: Ticket[] = SocketService.getTicketAction(data.ticketId)
    ticketAction.forEach((ticket) => {
      if (!ticket.ticketUserList) ticket.ticketUserList = []

      data.ticketUserInsertList?.forEach((i) => {
        if (!ticket.ticketUserGroup[i.interactType]) {
          ticket.ticketUserGroup[i.interactType] = {}
        }
        if (!ticket.ticketUserGroup[i.interactType][i.ticketItemId]) {
          ticket.ticketUserGroup[i.interactType][i.ticketItemId] = []
        }
        const currentTicketUserGroup = ticket.ticketUserGroup[i.interactType][i.ticketItemId]

        const indexInsert = ticket.ticketUserList!.findIndex((j) => {
          return j.id === i.id
        })
        if (indexInsert === -1) {
          const ticketUserNew = TicketUser.from(i)
          ticket.ticketUserList?.push(ticketUserNew)
          currentTicketUserGroup.push(ticketUserNew)
        }
      })
      data.ticketUserUpdateList?.forEach((i) => {
        if (!ticket.ticketUserGroup[i.interactType]) {
          ticket.ticketUserGroup[i.interactType] = {}
        }
        if (!ticket.ticketUserGroup[i.interactType][i.ticketItemId]) {
          ticket.ticketUserGroup[i.interactType][i.ticketItemId] = []
        }
        const currentTicketUserGroup = ticket.ticketUserGroup[i.interactType][i.ticketItemId]

        const findExistInList = ticket.ticketUserList?.find((j) => j.id === i.id)
        if (findExistInList) {
          Object.assign(findExistInList, i)
        }
        const findExistInGroup = currentTicketUserGroup.find((j) => j.id === i.id)
        if (findExistInGroup) {
          Object.assign(findExistInGroup, i)
        }
      })
      data.ticketUserDestroyList?.forEach((i) => {
        if (!ticket.ticketUserGroup[i.interactType]) {
          ticket.ticketUserGroup[i.interactType] = {}
        }
        if (!ticket.ticketUserGroup[i.interactType][i.ticketItemId]) {
          ticket.ticketUserGroup[i.interactType][i.ticketItemId] = []
        }
        const currentTicketUserGroup = ticket.ticketUserGroup[i.interactType][i.ticketItemId]

        const indexDestroyInList = ticket.ticketUserList!.findIndex((j) => {
          return j.id === i.id
        })
        if (indexDestroyInList !== -1) {
          ticket.ticketUserList?.splice(indexDestroyInList, 1)
        }
        const indexDestroyInGroup = currentTicketUserGroup.findIndex((j) => {
          return j.id === i.id
        })
        if (indexDestroyInGroup !== -1) {
          currentTicketUserGroup.splice(indexDestroyInGroup, 1)
        }
      })
    })
  }

  static async listenTicketClinicUpdateTicketProductConsumableList(data: {
    ticketId: number
    ticketProductConsumableList: any[]
  }) {
    const ticketFind = ticketClinicList.value.find((i) => i.id === data.ticketId)
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
    const ticketFind = ticketClinicList.value.find((i) => i.id === data.ticketId)
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
    const ticketFind = ticketClinicList.value.find((i) => i.id === data.ticketId)
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
    const ticketFind = ticketClinicList.value.find((i) => i.id === data.ticketId)
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

  static async listenTicketClinicUpdateTicketRadiologyList(data: {
    ticketId: number
    ticketRadiologyList: any[]
  }) {
    const ticketFind = ticketClinicList.value.find((i) => i.id === data.ticketId)
    if (ticketFind) {
      ticketFind.ticketRadiologyList = TicketRadiology.fromList(data.ticketRadiologyList)
    }
    if (ticketClinicRef.value.id === data.ticketId) {
      ticketClinicRef.value.ticketRadiologyList = TicketRadiology.fromList(data.ticketRadiologyList)
    }
  }

  static async listenTicketClinicUpdateTicketRadiologyResult(data: {
    ticketId: number
    ticketRadiology: any
  }) {
    const ticketFind = ticketClinicList.value.find((i) => i.id === data.ticketId)
    if (ticketFind) {
      const ticketRadiologyFind = (ticketFind.ticketRadiologyList || []).find((i) => {
        return i.id === data.ticketRadiology.id
      })
      if (ticketRadiologyFind) {
        Object.assign(ticketRadiologyFind, TicketRadiology.from(data.ticketRadiology))
      }
    }

    if (ticketClinicRef.value.id === data.ticketId) {
      ticketClinicRef.value.ticketRadiologyList ||= []
      const ticketRadiologyFind = ticketClinicRef.value.ticketRadiologyList.find((i) => {
        return i.id === data.ticketRadiology.id
      })
      if (ticketRadiologyFind) {
        Object.assign(ticketRadiologyFind, TicketRadiology.from(data.ticketRadiology))
      } else {
        ticketClinicRef.value.ticketRadiologyList.push(TicketRadiology.from(data.ticketRadiology))
      }
    }
  }
}
