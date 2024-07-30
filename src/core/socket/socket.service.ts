import { MeService } from '../../modules/_me/me.service'
import { Batch, useBatchStore } from '../../modules/batch'
import { Customer, useCustomerStore } from '../../modules/customer'
import { Distributor, useDistributorStore } from '../../modules/distributor'
import { Procedure, useProcedureStore } from '../../modules/procedure'
import { Product, useProductStore } from '../../modules/product'
import { Ticket } from '../../modules/ticket'
import { useTicketClinicStore } from '../../modules/ticket-clinic/ticket-clinic.store'
import { TicketDiagnosis } from '../../modules/ticket-diagnosis'
import { useTicketOrderStore } from '../../modules/ticket-order/ticket-order.store'
import { TicketProcedure } from '../../modules/ticket-procedure'
import { TicketProduct } from '../../modules/ticket-product'
import { TicketRadiology } from '../../modules/ticket-radiology'
import { ticketClinic } from '../../views/ticket-clinic/detail/ticket-clinic-detail.ref'
import { BatchDB } from '../indexed-db/repository/batch.repository'
import { CustomerDB } from '../indexed-db/repository/customer.repository'
import { DistributorDB } from '../indexed-db/repository/distributor.repository'
import { ProcedureDB } from '../indexed-db/repository/procedure.repository'
import { ProductDB } from '../indexed-db/repository/product.repository'

export class SocketService {
  static listenServerEmitDemo(data: any) {
    console.log('🚀 ~ file: socket.service.ts:3 ~ listenServerEmitDemo ~ data:', data)
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

  static async listenSettingReload(data: any) {
    await MeService.reloadSetting()
  }

  static async listenTicketClinicCreate(data: { ticket: any }) {
    const ticket = Ticket.from(data.ticket)
    const ticketClinicStore = useTicketClinicStore()

    ticketClinicStore.paginationMeta.total++
    if (ticketClinicStore.paginationMeta.page === 1) {
      ticketClinicStore.ticketList.unshift(ticket)
      if (ticketClinicStore.ticketList.length > ticketClinicStore.paginationMeta.limit) {
        ticketClinicStore.ticketList.pop()
      }
    }

    if (ticket.customer) {
      await CustomerDB.upsertOne(ticket.customer)
    }
  }

  static async listenTicketClinicUpdate(data: { ticketBasic: any }) {
    const ticketBasic = Ticket.from(data.ticketBasic)

    const ticketFind = useTicketClinicStore().ticketList.find((i) => i.id === ticketBasic.id)
    if (ticketFind) {
      Object.assign(ticketFind, ticketBasic)
    }

    if (ticketBasic.id === ticketClinic.value.id) {
      Object.assign(ticketClinic.value, ticketBasic)
    }
  }

  static async listenTicketClinicUpdateTicketDiagnosis(data: {
    ticketId: number
    ticketDiagnosis: any
  }) {
    const { ticketId } = data
    const ticketDiagnosis = TicketDiagnosis.from(data.ticketDiagnosis)
    const ticketClinicStore = useTicketClinicStore()

    const ticketFind = ticketClinicStore.ticketList.find((i) => i.id === data.ticketId)
    if (ticketFind) {
      Object.assign(ticketFind.ticketDiagnosis!, ticketDiagnosis)
    }

    if (ticketClinicStore.ticketHistory[ticketId]) {
      Object.assign(ticketClinicStore.ticketHistory[ticketId], ticketDiagnosis)
    }
    if (ticketClinic.value.id === ticketId) {
      Object.assign(ticketClinic.value.ticketDiagnosis!, ticketDiagnosis)
    }
  }

  static async listenTicketClinicChangeTicketProcedureList(data: {
    ticketId: number
    ticketProcedureList: any[]
  }) {
    const { ticketId, ticketProcedureList } = data

    const ticketFind = useTicketClinicStore().ticketList.find((i) => i.id === ticketId)
    if (ticketFind) {
      ticketFind.ticketProcedureList = TicketProcedure.fromList(ticketProcedureList)
    }

    if (ticketClinic.value.id === ticketId) {
      ticketClinic.value.ticketProcedureList = TicketProcedure.fromList(ticketProcedureList)
    }
  }

  static async listenTicketClinicChangeTicketRadiologyList(data: {
    ticketId: number
    ticketRadiologyList: any[]
  }) {
    const { ticketId, ticketRadiologyList } = data

    const ticketFind = useTicketClinicStore().ticketList.find((i) => i.id === ticketId)
    if (ticketFind) {
      ticketFind.ticketRadiologyList = TicketRadiology.fromList(ticketRadiologyList)
    }

    if (ticketClinic.value.id === ticketId) {
      ticketClinic.value.ticketRadiologyList = TicketRadiology.fromList(ticketRadiologyList)
    }
  }

  static async listenTicketClinicUpdateTicketRadiology(data: {
    ticketId: number
    ticketRadiology: any
  }) {
    const { ticketId } = data
    const ticketRadiology = TicketRadiology.from(data.ticketRadiology)

    const ticketFind = useTicketClinicStore().ticketList.find((i) => i.id === data.ticketId)
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

    if (ticketClinic.value.id === ticketId) {
      if (!ticketClinic.value.ticketRadiologyList) {
        ticketClinic.value.ticketRadiologyList = []
      }
      const ticketRadiologyFind = ticketClinic.value.ticketRadiologyList.find((i) => {
        return i.id === ticketRadiology.id
      })
      if (ticketRadiologyFind) {
        Object.assign(ticketRadiologyFind, ticketRadiology)
      } else {
        ticketClinic.value.ticketRadiologyList.push(ticketRadiology)
      }
    }
  }

  static async listenTicketClinicChangeTicketProductList(data: {
    ticketId: number
    ticketProductList: any[]
  }) {
    const { ticketId, ticketProductList } = data

    const ticketFind = useTicketClinicStore().ticketList.find((i) => i.id === ticketId)
    if (ticketFind) {
      ticketFind.ticketProductList = TicketProduct.fromList(ticketProductList)
    }

    if (ticketClinic.value.id === ticketId) {
      ticketClinic.value.ticketProductList = TicketProduct.fromList(ticketProductList)
    }
  }
}
