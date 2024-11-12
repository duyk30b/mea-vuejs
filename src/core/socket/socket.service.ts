import { MeService } from '../../modules/_me/me.service'
import { useMeStore } from '../../modules/_me/me.store'
import { Batch, useBatchStore } from '../../modules/batch'
import { Customer, useCustomerStore } from '../../modules/customer'
import { Distributor, useDistributorStore } from '../../modules/distributor'
import { Organization } from '../../modules/organization'
import { Procedure, useProcedureStore } from '../../modules/procedure'
import { Product, useProductStore } from '../../modules/product'
import { Ticket } from '../../modules/ticket'
import { ticketClinicList, ticketClinicRef } from '../../modules/ticket-clinic'
import { TicketDiagnosis } from '../../modules/ticket-diagnosis'
import { TicketParaclinical } from '../../modules/ticket-paraclinical'
import { TicketProcedure } from '../../modules/ticket-procedure'
import { TicketProduct } from '../../modules/ticket-product'
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

  static async listenTicketClinicUpdate(data: { ticketBasic: any }) {
    const ticketBasic = Ticket.from(data.ticketBasic)
    const ticketFind = ticketClinicList.value.find((i) => i.id === ticketBasic.id)
    if (ticketFind) {
      Object.assign(ticketFind, ticketBasic)
    }
    if (ticketClinicRef.value.id === ticketBasic.id) {
      Object.assign(ticketClinicRef.value, ticketBasic)
    }
  }

  static async listenTicketClinicUpdateTicketDiagnosisBasic(data: {
    ticketId: number
    ticketDiagnosisBasic: any
  }) {
    const ticketFind = ticketClinicList.value.find((i) => i.id === data.ticketId)
    if (ticketFind) {
      if (!ticketFind.ticketDiagnosis) {
        ticketFind.ticketDiagnosis = new TicketDiagnosis()
      }
      Object.assign(ticketFind.ticketDiagnosis, TicketDiagnosis.from(data.ticketDiagnosisBasic))
    }
    if (ticketClinicRef.value.id === data.ticketId) {
      Object.assign(
        ticketClinicRef.value.ticketDiagnosis!,
        TicketDiagnosis.from(data.ticketDiagnosisBasic)
      )
    }
  }

  static async listenTicketClinicUpdateTicketDiagnosisSpecial(data: {
    ticketId: number
    special: string
  }) {
    const ticketFind = ticketClinicList.value.find((i) => i.id === data.ticketId)
    if (ticketFind) {
      if (!ticketFind.ticketDiagnosis) {
        ticketFind.ticketDiagnosis = new TicketDiagnosis()
      }
      ticketFind.ticketDiagnosis.special = data.special
    }
    if (ticketClinicRef.value.id === data.ticketId) {
      ticketClinicRef.value.ticketDiagnosis!.special = data.special
    }
  }

  static async listenTicketClinicUpdateTicketProcedureList(data: {
    ticketId: number
    ticketProcedureList: any[]
  }) {
    const ticketFind = ticketClinicList.value.find((i) => i.id === data.ticketId)
    if (ticketFind) {
      ticketFind.ticketProcedureList = TicketProcedure.fromList(data.ticketProcedureList)
    }
    if (ticketClinicRef.value.id === data.ticketId) {
      ticketClinicRef.value.ticketProcedureList = TicketProcedure.fromList(data.ticketProcedureList)
    }
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

  static async listenTicketClinicUpdateTicketParaclinicalList(data: {
    ticketId: number
    ticketParaclinicalList: any[]
  }) {
    const ticketFind = ticketClinicList.value.find((i) => i.id === data.ticketId)
    if (ticketFind) {
      ticketFind.ticketParaclinicalList = TicketParaclinical.fromList(data.ticketParaclinicalList)
    }
    if (ticketClinicRef.value.id === data.ticketId) {
      ticketClinicRef.value.ticketParaclinicalList = TicketParaclinical.fromList(
        data.ticketParaclinicalList
      )
    }
  }

  static async listenTicketClinicUpdateTicketParaclinicalResult(data: {
    ticketId: number
    ticketParaclinical: any
  }) {
    const ticketFind = ticketClinicList.value.find((i) => i.id === data.ticketId)
    if (ticketFind) {
      const ticketParaclinicalFind = (ticketFind.ticketParaclinicalList || []).find((i) => {
        return i.id === data.ticketParaclinical.id
      })
      if (ticketParaclinicalFind) {
        Object.assign(ticketParaclinicalFind, TicketParaclinical.from(data.ticketParaclinical))
      }
    }

    if (ticketClinicRef.value.id === data.ticketId) {
      ticketClinicRef.value.ticketParaclinicalList ||= []
      const ticketParaclinicalFind = ticketClinicRef.value.ticketParaclinicalList.find((i) => {
        return i.id === data.ticketParaclinical.id
      })
      if (ticketParaclinicalFind) {
        Object.assign(ticketParaclinicalFind, TicketParaclinical.from(data.ticketParaclinical))
      } else {
        ticketClinicRef.value.ticketParaclinicalList.push(
          TicketParaclinical.from(data.ticketParaclinical)
        )
      }
    }
  }

  static async listenTicketClinicUpdateTicketUserList(data: {
    ticketId: number
    ticketUserList: any[]
  }) {
    const ticketFind = ticketClinicList.value.find((i) => i.id === data.ticketId)
    if (ticketFind) {
      ticketFind.ticketUserList = TicketUser.fromList(data.ticketUserList)
    }
    if (ticketClinicRef.value.id === data.ticketId) {
      ticketClinicRef.value.ticketUserList = TicketUser.fromList(data.ticketUserList)
    }
  }
}
