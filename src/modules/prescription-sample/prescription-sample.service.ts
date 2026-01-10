import { CollectionQuery } from '@/core/indexed-db/common/collection.query'
import { ref } from 'vue'
import { ESArray, ESString } from '../../utils'
import { MeService } from '../_me/me.service'
import { Product, ProductService } from '../product'
import { User, UserService } from '../user'
import { PrescriptionSampleApi } from './prescription-sample.api'
import type {
  PrescriptionSampleGetQuery,
  PrescriptionSampleListQuery,
  PrescriptionSamplePaginationQuery,
} from './prescription-sample.dto'
import { PrescriptionSample } from './prescription-sample.model'

const PrescriptionSampleDBQuery = new CollectionQuery<PrescriptionSample>()

export class PrescriptionSampleService {
  static loadedAll: boolean = false

  static prescriptionSampleAll = ref<PrescriptionSample[]>([])

  private static fetchAll = (() => {
    const start = async () => {
      try {
        const userId = MeService.user?.value?.id || 0
        const response = await PrescriptionSampleApi.list({
          // relation: { medicineList: true },
          // filter: { userId: { IN: [0, userId] } },
          sort: { id: 'ASC' },
        })
        const all = response.data
        await PrescriptionSampleService.executeRelation(all, { medicineList: { product: true } })
        PrescriptionSampleService.prescriptionSampleAll.value = all
      } catch (error: any) {
        console.log('🚀 ~ prescription-sample.service.ts:31 ~ start ~ error:', error)
      }
    }
    let fetchPromise: Promise<void> | null = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetchPromise || !PrescriptionSampleService.loadedAll || options.refetch) {
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
        return PrescriptionSampleDBQuery.executeFilter(i, filter as any)
      })
    }
    if (query.sort) {
      data = PrescriptionSampleDBQuery.executeSort(data, query.sort)
    }
    return data
  }

  static async executeRelation(
    prescriptionSampleList: PrescriptionSample[],
    relation: PrescriptionSampleGetQuery['relation'],
  ) {
    try {
      const prescriptionSampleIdList = prescriptionSampleList.map((i) => i.id)

      prescriptionSampleList.forEach((i) => {
        try {
          i.medicineList = JSON.parse(i.medicines || '[]')
        } catch (error) {
          i.medicineList = []
        }
      })
      const productIdList = prescriptionSampleList
        .map((i) => i.medicineList)
        .flat()
        .map((i) => i.productId)

      const [userMap, productList] = await Promise.all([
        relation?.user ? UserService.getMap() : <Record<string, User>>{},
        relation?.medicineList?.product
          ? ProductService.list({ filter: { id: { IN: productIdList } } })
          : <Product[]>[],
      ])

      const productMap = ESArray.arrayToKeyValue(productList, 'id')

      prescriptionSampleList.forEach((prescriptionSample) => {
        if (relation?.user) {
          prescriptionSample.user = userMap[prescriptionSample.userId]
        }
        if (relation?.medicineList?.product) {
          prescriptionSample.medicineList.forEach((m) => {
            m.product = productMap[m.productId]
          })
        }
      })
    } catch (error) {
      console.log('🚀 ~ radiology-sample.service.ts:91 ~ PrescriptionSampleService ~ error:', error)
    }
  }

  static async getAll(options?: { refetch?: boolean }) {
    await PrescriptionSampleService.fetchAll({ refetch: !!options?.refetch })
    return PrescriptionSampleService.prescriptionSampleAll.value
  }

  static async pagination(
    query: PrescriptionSamplePaginationQuery,
    options?: { refetch: boolean },
  ) {
    const page = query.page || 1
    const limit = query.limit || 10
    await PrescriptionSampleService.fetchAll({ refetch: !!options?.refetch })
    const dataQuery = PrescriptionSampleService.executeQuery(
      PrescriptionSampleService.prescriptionSampleAll.value,
      query,
    )
    const data = dataQuery.slice((page - 1) * limit, page * limit)
    if (query.relation) {
      await PrescriptionSampleService.executeRelation(data, query.relation)
    }
    return {
      data,
      meta: { total: dataQuery.length },
    }
  }

  static async list(query: PrescriptionSampleListQuery, options?: { refetch: boolean }) {
    await PrescriptionSampleService.fetchAll({ refetch: !!options?.refetch })
    const data = PrescriptionSampleService.executeQuery(
      PrescriptionSampleService.prescriptionSampleAll.value,
      query,
    )
    if (query.relation) {
      await PrescriptionSampleService.executeRelation(data, query.relation)
    }
    return PrescriptionSample.fromList(data)
  }

  static async search(text: string) {
    await PrescriptionSampleService.fetchAll()
    if (!text) text = ''
    const data = PrescriptionSampleService.prescriptionSampleAll.value.filter((i) => {
      if (ESString.customFilter(i.name || '', text, 2)) {
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
    PrescriptionSampleService.loadedAll = false
    // if (options?.clearCache) {
    // } else {
    //   const ins = PrescriptionSample.from(result)
    //   await PrescriptionSampleService.refreshMedicineList([ins])
    //   PrescriptionSampleService.prescriptionSampleAll.value.push(ins)
    // }
    // return result
  }

  static async updateOne(
    id: number,
    prescriptionSample: Partial<PrescriptionSample>,
    options?: { clearCache?: boolean },
  ) {
    const result = await PrescriptionSampleApi.updateOne(id, prescriptionSample)
    PrescriptionSampleService.loadedAll = false
    // if (options?.clearCache) {
    // } else {
    //   const ins = PrescriptionSample.from(result)
    //   await PrescriptionSampleService.refreshMedicineList([ins])
    //   const findIndex = PrescriptionSampleService.prescriptionSampleAll.value.findIndex(
    //     (i) => i.id === ins.id,
    //   )
    //   if (findIndex !== -1) {
    //     PrescriptionSampleService.prescriptionSampleAll.value[findIndex] = ins
    //   } else {
    //     PrescriptionSampleService.prescriptionSampleAll.value.push(ins)
    //   }
    // }
    return result
  }

  static async destroyOne(id: number, options?: { clearCache?: boolean }) {
    const result = await PrescriptionSampleApi.destroyOne(id)
    PrescriptionSampleService.loadedAll = false
    // if (options?.clearCache) {
    // } else {
    //   const findIndex = PrescriptionSampleService.prescriptionSampleAll.value.findIndex(
    //     (i) => i.id === id,
    //   )
    //   if (findIndex !== -1) {
    //     PrescriptionSampleService.prescriptionSampleAll.value.splice(findIndex, 1)
    //   }
    // }
    return result
  }
}
