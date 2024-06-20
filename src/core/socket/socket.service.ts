import { Batch, useBatchStore } from '../../modules/batch'
import { Customer, useCustomerStore } from '../../modules/customer'
import { Distributor, useDistributorStore } from '../../modules/distributor'
import { Procedure, useProcedureStore } from '../../modules/procedure'
import { Product, useProductStore } from '../../modules/product'
import { Visit } from '../../modules/visit'
import { VisitBatch } from '../../modules/visit-batch'
import { VisitDiagnosis } from '../../modules/visit-diagnosis'
import { VisitProcedure } from '../../modules/visit-procedure'
import { VisitProduct } from '../../modules/visit-product'
import { useVisitStore } from '../../modules/visit/visit.store'
import { visit } from '../../views/visit/detail/visit.ref'
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
    const distributor = Distributor.toBasic(data.distributor)
    await DistributorDB.upsertOne(distributor)
    useDistributorStore().timeSync = Date.now()
  }

  static async listenCustomerUpsert(data: { customer: any }) {
    const customer = Customer.toBasic(data.customer)
    await CustomerDB.upsertOne(customer)
    useCustomerStore().timeSync = Date.now()
  }

  static async listenProductUpsert(data: { product: any }) {
    const product = Product.toBasic(data.product)
    await ProductDB.upsertOne(product)
    useProductStore().timeSync = Date.now()
  }

  static async listenProductListUpdate(data: { productList: any[] }) {
    const productList = Product.toBasics(data.productList)
    await ProductDB.upsertMany(productList)
    useProductStore().timeSync = Date.now()
  }

  static async listenBatchUpsert(data: { batch: any }) {
    const batch = Batch.toBasic(data.batch)
    await BatchDB.upsertOne(batch)
    useBatchStore().timeSync = Date.now()
  }

  static async listenBatchListUpdate(data: { batchList: any[] }) {
    const batchList = Batch.toBasics(data.batchList)
    await BatchDB.upsertMany(batchList)
    useBatchStore().timeSync = Date.now()
  }

  static async listenProcedureUpsert(data: { procedure: any }) {
    const procedure = Procedure.toBasic(data.procedure)
    await ProcedureDB.upsertOne(procedure)
    useProcedureStore().timeSync = Date.now()
  }

  static async listenVisitCreate(data: { visit: any }) {
    const visit = Visit.fromPlain(data.visit)
    const visitStore = useVisitStore()

    visitStore.paginationMeta.total++
    if (visitStore.paginationMeta.page === 1) {
      visitStore.visitList.unshift(visit)
      if (visitStore.visitList.length > visitStore.paginationMeta.limit) {
        visitStore.visitList.pop()
      }
    }

    if (visit.customer) {
      await CustomerDB.upsertOne(visit.customer)
    }
  }

  static async listenVisitUpdate(data: { visitBasic: any }) {
    const visitResponse = Visit.toBasic(data.visitBasic)

    const visitFind = useVisitStore().visitList.find((i) => i.id === visitResponse.id)
    if (visitFind) {
      Object.assign(visitFind, visitResponse)
    }

    if (visitResponse.id === visit.value.id) {
      Object.assign(visit.value, visitResponse)
    }
  }

  static async listenVisitUpdateVisitDiagnosis(data: { visitId: number; visitDiagnosis: any }) {
    const { visitId } = data
    const visitDiagnosis = VisitDiagnosis.fromPlain(data.visitDiagnosis)

    const visitFind = useVisitStore().visitList.find((i) => i.id === data.visitId)
    if (visitFind) {
      Object.assign(visitFind.visitDiagnosis!, visitDiagnosis)
    }

    if (visit.value.id === visitId) {
      Object.assign(visit.value.visitDiagnosis!, visitDiagnosis)
    }
  }

  static async listenVisitReplaceVisitProductList(data: {
    visitId: number
    visitProductList: any[]
  }) {
    const { visitId, visitProductList } = data

    const visitFind = useVisitStore().visitList.find((i) => i.id === visitId)
    if (visitFind) {
      visitFind.visitProductList = VisitProduct.fromPlains(visitProductList)
    }

    if (visit.value.id === visitId) {
      visit.value.visitProductList = VisitProduct.fromPlains(visitProductList)
    }
  }

  static async listenVisitReplaceVisitBatchList(data: { visitId: number; visitBatchList: any[] }) {
    const { visitId, visitBatchList } = data

    const visitFind = useVisitStore().visitList.find((i) => i.id === visitId)
    if (visitFind) {
      visitFind.visitBatchList = VisitBatch.fromPlains(visitBatchList)
    }

    if (visit.value.id === visitId) {
      visit.value.visitBatchList = VisitBatch.fromPlains(visitBatchList)
    }
  }

  static async listenVisitReplaceVisitProcedureList(data: {
    visitId: number
    visitProcedureList: any[]
  }) {
    const { visitId, visitProcedureList } = data

    const visitFind = useVisitStore().visitList.find((i) => i.id === visitId)
    if (visitFind) {
      visitFind.visitProcedureList = VisitProcedure.fromPlains(visitProcedureList)
    }

    if (visit.value.id === visitId) {
      visit.value.visitProcedureList = VisitProcedure.fromPlains(visitProcedureList)
    }
  }
}
