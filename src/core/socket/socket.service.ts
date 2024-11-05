import { MeService } from '../../modules/_me/me.service'
import { useMeStore } from '../../modules/_me/me.store'
import { Batch, useBatchStore } from '../../modules/batch'
import { Customer, useCustomerStore } from '../../modules/customer'
import { Distributor, useDistributorStore } from '../../modules/distributor'
import { VoucherType } from '../../modules/enum'
import { Organization } from '../../modules/organization'
import { Procedure, useProcedureStore } from '../../modules/procedure'
import { Product, useProductStore } from '../../modules/product'
import { Ticket } from '../../modules/ticket'
import { ticketClinicList, ticketClinicRef } from '../../modules/ticket-clinic'
import { TicketDiagnosis } from '../../modules/ticket-diagnosis'
import { ticketEyeList, ticketEyeRef } from '../../modules/ticket-eye'
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

    if (ticket.voucherType === VoucherType.Clinic) {
      const ticketFind = ticketClinicList.value.find((i) => i.id === ticket.id)
      if (ticketFind) {
        Object.assign(ticketFind, ticket)
      } else {
        ticketClinicList.value.unshift(ticket)
      }
    }

    if (ticket.voucherType === VoucherType.Eye) {
      const ticketFind = ticketEyeList.value.find((i) => i.id === ticket.id)
      if (ticketFind) {
        Object.assign(ticketFind, ticket)
      } else {
        ticketEyeList.value.unshift(ticket)
      }
    }

    if (ticket.customer) {
      await CustomerDB.upsertOne(ticket.customer)
    }
  }

  static async listenTicketDestroy(data: { ticketId: any; voucherType: VoucherType }) {
    if (data.voucherType === VoucherType.Clinic) {
      const findIndex = ticketClinicList.value.findIndex((i) => i.id === data.ticketId)
      if (findIndex !== -1) {
        ticketClinicList.value.splice(findIndex, 1)
      }
    }

    if (data.voucherType === VoucherType.Eye) {
      const findIndex = ticketEyeList.value.findIndex((i) => i.id === data.ticketId)
      if (findIndex !== -1) {
        ticketEyeList.value.splice(findIndex, 1)
      }
    }
  }

  static async listenTicketUpdate(data: { ticketBasic: any }) {
    const ticketBasic = Ticket.from(data.ticketBasic)
    if (ticketBasic.voucherType === VoucherType.Clinic) {
      const ticketFind = ticketClinicList.value.find((i) => i.id === ticketBasic.id)
      if (ticketFind) {
        Object.assign(ticketFind, ticketBasic)
      }
      if (ticketClinicRef.value.id === ticketBasic.id) {
        Object.assign(ticketClinicRef.value, ticketBasic)
      }
    }

    if (ticketBasic.voucherType === VoucherType.Eye) {
      const ticketFind = ticketEyeList.value.find((i) => i.id === ticketBasic.id)
      if (ticketFind) {
        Object.assign(ticketFind, ticketBasic)
      }
      if (ticketEyeRef.value.id === ticketBasic.id) {
        Object.assign(ticketEyeRef.value, ticketBasic)
      }
    }
  }

  static async listenTicketUpdateTicketDiagnosisBasic(data: {
    ticketId: number
    voucherType: VoucherType
    ticketDiagnosisBasic: any
  }) {
    if (data.voucherType === VoucherType.Clinic) {
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

    if (data.voucherType === VoucherType.Eye) {
      const ticketFind = ticketEyeList.value.find((i) => i.id === data.ticketId)
      if (ticketFind) {
        if (!ticketFind.ticketDiagnosis) {
          ticketFind.ticketDiagnosis = new TicketDiagnosis()
        }
        Object.assign(ticketFind.ticketDiagnosis, TicketDiagnosis.from(data.ticketDiagnosisBasic))
      }
      if (ticketEyeRef.value.id === data.ticketId) {
        Object.assign(
          ticketEyeRef.value.ticketDiagnosis!,
          TicketDiagnosis.from(data.ticketDiagnosisBasic)
        )
      }
    }
  }

  static async listenTicketUpdateTicketDiagnosisSpecial(data: {
    ticketId: number
    voucherType: VoucherType
    special: string
  }) {
    if (data.voucherType === VoucherType.Clinic) {
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

    if (data.voucherType === VoucherType.Eye) {
      const ticketFind = ticketEyeList.value.find((i) => i.id === data.ticketId)
      if (ticketFind) {
        if (!ticketFind.ticketDiagnosis) {
          ticketFind.ticketDiagnosis = new TicketDiagnosis()
        }
        ticketFind.ticketDiagnosis.special = data.special
      }
      if (ticketEyeRef.value.id === data.ticketId) {
        ticketEyeRef.value.ticketDiagnosis!.special = data.special
      }
    }
  }

  static async listenTicketUpdateTicketProcedureList(data: {
    ticketId: number
    voucherType: VoucherType
    ticketProcedureList: any[]
  }) {
    if (data.voucherType === VoucherType.Clinic) {
      const ticketFind = ticketClinicList.value.find((i) => i.id === data.ticketId)
      if (ticketFind) {
        ticketFind.ticketProcedureList = TicketProcedure.fromList(data.ticketProcedureList)
      }
      if (ticketClinicRef.value.id === data.ticketId) {
        ticketClinicRef.value.ticketProcedureList = TicketProcedure.fromList(
          data.ticketProcedureList
        )
      }
    }

    if (data.voucherType === VoucherType.Eye) {
      const ticketFind = ticketEyeList.value.find((i) => i.id === data.ticketId)
      if (ticketFind) {
        ticketFind.ticketProcedureList = TicketProcedure.fromList(data.ticketProcedureList)
      }
      if (ticketEyeRef.value.id === data.ticketId) {
        ticketEyeRef.value.ticketProcedureList = TicketProcedure.fromList(data.ticketProcedureList)
      }
    }
  }

  static async listenTicketUpdateTicketProductConsumableList(data: {
    ticketId: number
    voucherType: VoucherType
    ticketProductConsumableList: any[]
  }) {
    if (data.voucherType === VoucherType.Clinic) {
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

    if (data.voucherType === VoucherType.Eye) {
      const ticketFind = ticketEyeList.value.find((i) => i.id === data.ticketId)
      if (ticketFind) {
        ticketFind.ticketProductConsumableList = TicketProduct.fromList(
          data.ticketProductConsumableList
        )
      }
      if (ticketEyeRef.value.id === data.ticketId) {
        ticketEyeRef.value.ticketProductConsumableList = TicketProduct.fromList(
          data.ticketProductConsumableList
        )
      }
    }
  }

  static async listenTicketUpdateTicketProductPrescriptionList(data: {
    ticketId: number
    voucherType: VoucherType
    ticketProductPrescriptionList: any[]
  }) {
    if (data.voucherType === VoucherType.Clinic) {
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

    if (data.voucherType === VoucherType.Eye) {
      const ticketFind = ticketEyeList.value.find((i) => i.id === data.ticketId)
      if (ticketFind) {
        ticketFind.ticketProductPrescriptionList = TicketProduct.fromList(
          data.ticketProductPrescriptionList
        )
      }
      if (ticketEyeRef.value.id === data.ticketId) {
        ticketEyeRef.value.ticketProductPrescriptionList = TicketProduct.fromList(
          data.ticketProductPrescriptionList
        )
      }
    }
  }

  static async listenTicketUpdateTicketRadiologyList(data: {
    ticketId: number
    voucherType: VoucherType
    ticketRadiologyList: any[]
  }) {
    if (data.voucherType === VoucherType.Clinic) {
      const ticketFind = ticketClinicList.value.find((i) => i.id === data.ticketId)
      if (ticketFind) {
        ticketFind.ticketRadiologyList = TicketRadiology.fromList(data.ticketRadiologyList)
      }
      if (ticketClinicRef.value.id === data.ticketId) {
        ticketClinicRef.value.ticketRadiologyList = TicketRadiology.fromList(
          data.ticketRadiologyList
        )
      }
    }

    if (data.voucherType === VoucherType.Eye) {
      const ticketFind = ticketEyeList.value.find((i) => i.id === data.ticketId)
      if (ticketFind) {
        ticketFind.ticketRadiologyList = TicketRadiology.fromList(data.ticketRadiologyList)
      }
      if (ticketEyeRef.value.id === data.ticketId) {
        ticketEyeRef.value.ticketRadiologyList = TicketRadiology.fromList(data.ticketRadiologyList)
      }
    }
  }

  static async listenTicketUpdateTicketRadiologyResult(data: {
    ticketId: number
    voucherType: VoucherType
    ticketRadiology: any
  }) {
    const { ticketId } = data
    const ticketRadiology = TicketRadiology.from(data.ticketRadiology)

    if (data.voucherType === VoucherType.Clinic) {
      const ticketFind = ticketClinicList.value.find((i) => i.id === data.ticketId)
      if (ticketFind) {
        const ticketRadiologyFind = (ticketFind.ticketRadiologyList || []).find((i) => {
          return i.id === data.ticketRadiology.id
        })
        if (ticketRadiologyFind) {
          Object.assign(ticketRadiologyFind, ticketRadiology)
        }
      }

      if (ticketClinicRef.value.id === data.ticketId) {
        const ticketRadiologyFind = (ticketClinicRef.value.ticketRadiologyList || []).find((i) => {
          return i.id === data.ticketRadiology.id
        })
        if (ticketRadiologyFind) {
          Object.assign(ticketRadiologyFind, ticketRadiology)
        }
      }
    }

    if (data.voucherType === VoucherType.Eye) {
      const ticketFind = ticketEyeList.value.find((i) => i.id === data.ticketId)
      if (ticketFind) {
        const ticketRadiologyFind = (ticketFind.ticketRadiologyList || []).find((i) => {
          return i.id === data.ticketRadiology.id
        })
        if (ticketRadiologyFind) {
          Object.assign(ticketRadiologyFind, ticketRadiology)
        }
      }

      if (ticketEyeRef.value.id === data.ticketId) {
        const ticketRadiologyFind = (ticketEyeRef.value.ticketRadiologyList || []).find((i) => {
          return i.id === data.ticketRadiology.id
        })
        if (ticketRadiologyFind) {
          Object.assign(ticketRadiologyFind, ticketRadiology)
        }
      }
    }
  }

  static async listenTicketUpdateTicketUserList(data: {
    ticketId: number
    voucherType: VoucherType
    ticketUserList: any[]
  }) {
    if (data.voucherType === VoucherType.Clinic) {
      const ticketFind = ticketClinicList.value.find((i) => i.id === data.ticketId)
      if (ticketFind) {
        ticketFind.ticketUserList = TicketUser.fromList(data.ticketUserList)
      }
      if (ticketClinicRef.value.id === data.ticketId) {
        ticketClinicRef.value.ticketUserList = TicketUser.fromList(data.ticketUserList)
      }
    }

    if (data.voucherType === VoucherType.Eye) {
      const ticketFind = ticketEyeList.value.find((i) => i.id === data.ticketId)
      if (ticketFind) {
        ticketFind.ticketUserList = TicketUser.fromList(data.ticketUserList)
      }
      if (ticketEyeRef.value.id === data.ticketId) {
        ticketEyeRef.value.ticketUserList = TicketUser.fromList(data.ticketUserList)
      }
    }
  }
}
