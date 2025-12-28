import { Batch } from '@/modules/batch'
import { DiscountService } from '@/modules/discount'
import { ExpenseService } from '@/modules/expense'
import { LaboratoryService } from '@/modules/laboratory'
import { LaboratoryGroupService } from '@/modules/laboratory-group'
import { ProcedureService } from '@/modules/procedure'
import { RadiologyService } from '@/modules/radiology'
import { RadiologyGroupService } from '@/modules/radiology-group'
import { RegimenService } from '@/modules/regimen'
import {
  roomDeliveryPagination,
  roomFinancePagination,
  ticketRoomRef,
} from '@/modules/room/room.ref'
import { SurchargeService } from '@/modules/surcharge'
import { WalletService } from '@/modules/wallet'
import { MeService } from '../../modules/_me/me.service'
import { Customer } from '../../modules/customer'
import { DistributorService } from '../../modules/distributor'
import { Organization } from '../../modules/organization'
import { PositionService } from '../../modules/position'
import { Product } from '../../modules/product'
import { Ticket } from '../../modules/ticket'
import { BatchDB } from '../indexed-db/repository/batch.repository'
import { CustomerDB } from '../indexed-db/repository/customer.repository'
import { ProductDB } from '../indexed-db/repository/product.repository'

export class SocketService {
  static listenServerEmitDemo(data: any) {
    console.log('🚀 ~ file: socket.service.ts:3 ~ listenServerEmitDemo ~ data:', data)
  }

  static async masterDataChange(data: { laboratory: boolean; laboratoryGroup: boolean }) { }

  static async listenOrganizationUpdate(data: { organization: Organization }) {
    const organization = Organization.from(data.organization)
    MeService.organization.value = organization
  }

  static async listenSettingReload(data: any) {
    await MeService.reloadSetting()
  }

  static async listenMasterDataChange(data: {
    distributor?: boolean
    procedure?: boolean
    regimen?: boolean
    laboratory?: boolean
    laboratoryGroup?: boolean
    radiology?: boolean
    radiologyGroup?: boolean
    position?: boolean
    discount?: boolean
    surcharge?: boolean
    expense?: boolean
    wallet?: boolean
  }) {
    if (data.distributor) DistributorService.loadedAll = false
    if (data.procedure) ProcedureService.loadedAll = false
    if (data.regimen) RegimenService.loadedAll = false
    if (data.laboratory) LaboratoryService.loadedAll = false
    if (data.laboratoryGroup) LaboratoryGroupService.loadedAll = false
    if (data.radiology) RadiologyService.loadedAll = false
    if (data.radiologyGroup) RadiologyGroupService.loadedAll = false
    if (data.position) PositionService.loadedAll = false
    if (data.discount) DiscountService.loadedAll = false
    if (data.surcharge) SurchargeService.loadedAll = false
    if (data.expense) ExpenseService.loadedAll = false
    if (data.wallet) WalletService.loadedAll = false
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
    batchDestroyedList?: any[]
    batchUpsertedList?: any[]
  }) {
    if (data.productUpsertedList?.length) {
      const productUpsertedList = Product.fromList(data.productUpsertedList)
      await ProductDB.upsertMany(productUpsertedList)
    }
    if (data.productDestroyedList?.length) {
      const productIdDestroyList = data.productDestroyedList.map((i) => i.id)
      await ProductDB.deleteMany(productIdDestroyList)
    }
    if (data.batchUpsertedList?.length) {
      const batchUpsertedList = Batch.fromList(data.batchUpsertedList)
      await BatchDB.upsertMany(batchUpsertedList)
    }
    if (data.batchDestroyedList?.length) {
      const batchIdDestroyList = data.batchDestroyedList.map((i) => i.id)
      await BatchDB.deleteMany(batchIdDestroyList)
    }
  }

  static getTicketAction(options: { ticketId: string }) {
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
}
