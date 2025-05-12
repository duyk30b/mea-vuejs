import { DString, ESArray } from '../../utils'
import { ProductService } from '../product'
import { PrescriptionSampleApi } from './prescription-sample.api'
import type {
  PrescriptionSampleListQuery,
  PrescriptionSamplePaginationQuery,
} from './prescription-sample.dto'
import { PrescriptionSample } from './prescription-sample.model'

export class PrescriptionSampleService {
  static loadedAll: boolean = false

  static prescriptionSampleAll: PrescriptionSample[] = []

  private static fetchAll = (() => {
    const start = async () => {
      try {
        const { data } = await PrescriptionSampleApi.list({
          // relation: { medicineList: true },
          sort: { id: 'ASC' },
        })
        await PrescriptionSampleService.refreshMedicineList(data)
        PrescriptionSampleService.prescriptionSampleAll = data
      } catch (error: any) {
        console.log('🚀 ~ prescription-sample.service.ts:31 ~ start ~ error:', error)
      }
    }
    let fetchPromise: Promise<void> | null = null
    return async (options: { refresh?: boolean } = {}) => {
      if (!fetchPromise || !PrescriptionSampleService.loadedAll || options.refresh) {
        PrescriptionSampleService.loadedAll = true
        fetchPromise = start()
      }
      await fetchPromise
    }
  })()

  private static executeQuery(all: PrescriptionSample[], query: PrescriptionSamplePaginationQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        return true
      })
    }
    if (query.sort) {
      if (query.sort.id) {
        data.sort((a, b) => {
          if (query.sort?.id === 'ASC') return a.id < b.id ? -1 : 1
          if (query.sort?.id === 'DESC') return a.id > b.id ? -1 : 1
          return a.id > b.id ? -1 : 1
        })
      }
      if (query.sort.priority) {
        data.sort((a, b) => {
          if (query.sort?.priority === 'ASC') return a.priority < b.priority ? -1 : 1
          if (query.sort?.priority === 'DESC') return a.priority > b.priority ? -1 : 1
          return a.priority > b.priority ? -1 : 1
        })
      }
    }
    return data
  }

  static async refreshMedicineList(psList: PrescriptionSample[]) {
    psList.forEach((i) => {
      try {
        i.medicineList = JSON.parse(i.medicines || '[]')
      } catch (error) {
        i.medicineList = []
      }
    })
    const productIdList = psList
      .map((i) => i.medicineList)
      .flat()
      .map((i) => i.productId)
    const productList = await ProductService.list({ filter: { id: { IN: productIdList } } })
    const productMap = ESArray.arrayToKeyValue(productList, 'id')
    psList.forEach((ps) => {
      ps.medicineList.forEach((m) => {
        m.product = productMap[m.productId]
      })
    })
  }

  static async pagination(query: PrescriptionSamplePaginationQuery) {
    const page = query.page || 1
    const limit = query.limit || 10
    await PrescriptionSampleService.fetchAll()
    let data = PrescriptionSampleService.executeQuery(
      PrescriptionSampleService.prescriptionSampleAll,
      query,
    )
    data = data.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { total: PrescriptionSampleService.prescriptionSampleAll.length },
    }
  }

  static async list(query: PrescriptionSampleListQuery) {
    await PrescriptionSampleService.fetchAll()
    const data = PrescriptionSampleService.executeQuery(
      PrescriptionSampleService.prescriptionSampleAll,
      query,
    )

    return PrescriptionSample.fromList(data)
  }

  static async search(text: string) {
    await PrescriptionSampleService.fetchAll()
    if (!text) text = ''
    const data = PrescriptionSampleService.prescriptionSampleAll.filter((i) => {
      if (DString.customFilter(i.name || '', text, 2)) {
        return true
      }
      return false
    })
    return PrescriptionSample.fromList(data)
  }

  static async createOne(
    prescriptionSample: PrescriptionSample,
    options?: { clearCache?: boolean },
  ) {
    const result = await PrescriptionSampleApi.createOne(prescriptionSample)
    if (options?.clearCache) {
      PrescriptionSampleService.loadedAll = false
    } else {
      const ins = PrescriptionSample.from(result)
      await PrescriptionSampleService.refreshMedicineList([ins])
      PrescriptionSampleService.prescriptionSampleAll.push(ins)
    }
    return result
  }

  static async updateOne(
    id: number,
    prescriptionSample: Partial<PrescriptionSample>,
    options?: { clearCache?: boolean },
  ) {
    const result = await PrescriptionSampleApi.updateOne(id, prescriptionSample)
    if (options?.clearCache) {
      PrescriptionSampleService.loadedAll = false
    } else {
      const ins = PrescriptionSample.from(result)
      await PrescriptionSampleService.refreshMedicineList([ins])
      const findIndex = PrescriptionSampleService.prescriptionSampleAll.findIndex(
        (i) => i.id === ins.id,
      )
      if (findIndex !== -1) {
        PrescriptionSampleService.prescriptionSampleAll[findIndex] = ins
      } else {
        PrescriptionSampleService.prescriptionSampleAll.push(ins)
      }
    }
    return result
  }

  static async destroyOne(id: number, options?: { clearCache?: boolean }) {
    const result = await PrescriptionSampleApi.destroyOne(id)
    if (options?.clearCache) {
      PrescriptionSampleService.loadedAll = false
    } else {
      const findIndex = PrescriptionSampleService.prescriptionSampleAll.findIndex(
        (i) => i.id === id,
      )
      if (findIndex !== -1) {
        PrescriptionSampleService.prescriptionSampleAll.splice(findIndex, 1)
      }
    }
    return result
  }
}
