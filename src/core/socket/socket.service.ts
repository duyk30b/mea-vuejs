import { MeService } from '../../modules/_me/me.service'
import { useMeStore } from '../../modules/_me/me.store'
import { Batch, useBatchStore } from '../../modules/batch'
import { Customer, useCustomerStore } from '../../modules/customer'
import { Distributor, useDistributorStore } from '../../modules/distributor'
import { Organization } from '../../modules/organization'
import { Procedure, useProcedureStore } from '../../modules/procedure'
import { Product, useProductStore } from '../../modules/product'
import { Ticket, ticketHistory, ticketPagination, ticketRef } from '../../modules/ticket'
import { TicketDiagnosis } from '../../modules/ticket-diagnosis'
import { TicketProcedure } from '../../modules/ticket-procedure'
import { TicketProduct } from '../../modules/ticket-product'
import { TicketRadiology } from '../../modules/ticket-radiology'
import { TicketUser } from '../../modules/ticket-user'
import { BatchDB } from '../indexed-db/repository/batch.repository'
import { CustomerDB } from '../indexed-db/repository/customer.repository'
import { DistributorDB } from '../indexed-db/repository/distributor.repository'
import { ProcedureDB } from '../indexed-db/repository/procedure.repository'
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

  static async listenDistributorUpsert(data: { distributor: any }) {
    const distributor = Distributor.from(data.distributor)
    await DistributorDB.upsertOne(distributor)
    useDistributorStore().timeSync = Date.now()
  }

  static async listenCustomerUpsert(data: { customer: any }) {
    const customer = Customer.from(data.customer)
    await CustomerDB.upsertOne(customer)
    useCustomerStore().timeSync = Date.now()
  }

  static async listenProductUpsert(data: { product: any }) {
    const product = Product.from(data.product)
    await ProductDB.upsertOne(product)
    useProductStore().timeSync = Date.now()
  }

  static async listenProductListUpdate(data: { productList: any[] }) {
    const productList = Product.fromList(data.productList)
    await ProductDB.upsertMany(productList)
    useProductStore().timeSync = Date.now()
  }

  static async listenBatchUpsert(data: { batch: any }) {
    const batch = Batch.from(data.batch)
    await BatchDB.upsertOne(batch)
    useBatchStore().timeSync = Date.now()
  }

  static async listenBatchListUpdate(data: { batchList: any[] }) {
    const batchList = Batch.fromList(data.batchList)
    await BatchDB.upsertMany(batchList)
    useBatchStore().timeSync = Date.now()
  }

  static async listenProcedureUpsert(data: { procedure: any }) {
    const procedure = Procedure.from(data.procedure)
    await ProcedureDB.upsertOne(procedure)
    useProcedureStore().timeSync = Date.now()
  }

  static async listenTicketCreate(data: { ticket: any }) {
    const ticket = Ticket.from(data.ticket)

    if (ticket.voucherType === ticketPagination.value.meta.voucherType) {
      ticketPagination.value.meta.total++
      if (ticketPagination.value.meta.page === 1) {
        ticketPagination.value.data.unshift(ticket)
        if (ticketPagination.value.data.length > ticketPagination.value.meta.limit) {
          ticketPagination.value.data.pop()
        }
      }
    }

    if (ticket.customer) {
      await CustomerDB.upsertOne(ticket.customer)
    }
  }

  static async listenTicketUpdate(data: { ticketBasic: any }) {
    const ticketBasic = Ticket.from(data.ticketBasic)

    const ticketFind = ticketPagination.value.data.find((i) => i.id === ticketBasic.id)
    if (ticketFind) {
      Object.assign(ticketFind, ticketBasic)
    }

    if (ticketBasic.id === ticketRef.value.id) {
      Object.assign(ticketRef.value, ticketBasic)
    }
  }

  static async listenTicketUpdateTicketDiagnosis(data: { ticketId: number; ticketDiagnosis: any }) {
    const { ticketId } = data
    const ticketDiagnosis = TicketDiagnosis.from(data.ticketDiagnosis)

    const ticketFind = ticketPagination.value.data.find((i) => i.id === data.ticketId)
    if (ticketFind) {
      Object.assign(ticketFind.ticketDiagnosis!, ticketDiagnosis)
    }

    if (ticketHistory.value[ticketId]) {
      Object.assign(ticketHistory.value[ticketId], ticketDiagnosis)
    }
    if (ticketRef.value.id === ticketId) {
      Object.assign(ticketRef.value.ticketDiagnosis!, ticketDiagnosis)
    }
  }

  static async listenTicketChangeTicketProcedureList(data: {
    ticketId: number
    ticketProcedureList: any[]
  }) {
    const { ticketId, ticketProcedureList } = data

    const ticketFind = ticketPagination.value.data.find((i) => i.id === ticketId)
    if (ticketFind) {
      ticketFind.ticketProcedureList = TicketProcedure.fromList(ticketProcedureList)
    }

    if (ticketRef.value.id === ticketId) {
      ticketRef.value.ticketProcedureList = TicketProcedure.fromList(ticketProcedureList)
    }
  }

  static async listenTicketChangeTicketRadiologyList(data: {
    ticketId: number
    ticketRadiologyList: any[]
  }) {
    const { ticketId, ticketRadiologyList } = data

    const ticketFind = ticketPagination.value.data.find((i) => i.id === ticketId)
    if (ticketFind) {
      ticketFind.ticketRadiologyList = TicketRadiology.fromList(ticketRadiologyList)
    }

    if (ticketRef.value.id === ticketId) {
      ticketRef.value.ticketRadiologyList = TicketRadiology.fromList(ticketRadiologyList)
    }
  }

  static async listenTicketUpdateTicketRadiology(data: { ticketId: number; ticketRadiology: any }) {
    const { ticketId } = data
    const ticketRadiology = TicketRadiology.from(data.ticketRadiology)

    const ticketFind = ticketPagination.value.data.find((i) => i.id === data.ticketId)
    if (ticketFind) {
      if (!ticketFind.ticketRadiologyList) {
        ticketFind.ticketRadiologyList = []
      }
      const ticketRadiologyFind = ticketFind.ticketRadiologyList.find((i) => {
        return i.id === ticketRadiology.id
      })
      if (ticketRadiologyFind) {
        Object.assign(ticketRadiologyFind, ticketRadiology)
      } else {
        ticketFind.ticketRadiologyList.push(ticketRadiology)
      }
    }

    if (ticketRef.value.id === ticketId) {
      if (!ticketRef.value.ticketRadiologyList) {
        ticketRef.value.ticketRadiologyList = []
      }
      const ticketRadiologyFind = ticketRef.value.ticketRadiologyList.find((i) => {
        return i.id === ticketRadiology.id
      })
      if (ticketRadiologyFind) {
        Object.assign(ticketRadiologyFind, ticketRadiology)
      } else {
        ticketRef.value.ticketRadiologyList.push(ticketRadiology)
      }
    }
  }

  static async listenTicketChangeTicketProductList(data: {
    ticketId: number
    ticketProductList: any[]
  }) {
    const { ticketId, ticketProductList } = data

    const ticketFind = ticketPagination.value.data.find((i) => i.id === ticketId)
    if (ticketFind) {
      ticketFind.ticketProductList = TicketProduct.fromList(ticketProductList)
    }

    if (ticketRef.value.id === ticketId) {
      ticketRef.value.ticketProductList = TicketProduct.fromList(ticketProductList)
    }
  }

  static async listenTicketChangeTicketUserList(data: { ticketId: number; ticketUserList: any[] }) {
    const { ticketId, ticketUserList } = data

    const ticketFind = ticketPagination.value.data.find((i) => i.id === ticketId)
    if (ticketFind) {
      ticketFind.ticketUserList = TicketUser.fromList(ticketUserList)
    }

    if (ticketRef.value.id === ticketId) {
      ticketRef.value.ticketUserList = TicketUser.fromList(ticketUserList)
    }
  }
}
