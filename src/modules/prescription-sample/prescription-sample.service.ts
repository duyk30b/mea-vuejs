import { CollectionQuery } from '@/core/indexed-db/common/collection.query'
import { ref } from 'vue'
import { ESArray, ESString } from '../../utils'
import { MeService } from '../_me/me.service'
import { Product, ProductService } from '../product'
import { User, UserService } from '../user'
import type { PrescriptionSampleItem } from './prescription-sample-item.model'
import { PrescriptionSampleApi } from './prescription-sample.api'
import type {
  PrescriptionSampleDetailQuery,
  PrescriptionSampleGetQuery,
  PrescriptionSampleListQuery,
  PrescriptionSamplePaginationQuery,
} from './prescription-sample.dto'
import { PrescriptionSample } from './prescription-sample.model'

const PrescriptionSampleDBQuery = new CollectionQuery<PrescriptionSample>()

export class PrescriptionSampleService {
  static loadedAll: boolean = false

  static prescriptionSampleAll = ref<PrescriptionSample[]>([])
  static prescriptionSampleMap = ref<Record<string, PrescriptionSample>>({})

  private static fetchAll = (() => {
    const start = async () => {
      try {
        const userId = MeService.user?.value?.id || 0
        const prescriptionSampleAll = await PrescriptionSampleApi.list({
          relation: { prescriptionSampleItemList: { product: false } },
          // filter: { userId: { IN: [0, userId] } },
          sort: { priority: 'ASC' },
        })
        await PrescriptionSampleService.executeRelation(prescriptionSampleAll, {
          prescriptionSampleItemList: { product: false },
        })
        PrescriptionSampleService.prescriptionSampleAll.value = prescriptionSampleAll
      } catch (error: any) {
        console.log('🚀 ~ prescription-sample.service.ts:39 ~ start ~ error:', error)
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

      const productIdList = prescriptionSampleList
        .map((i) => i.prescriptionSampleItemList)
        .flat()
        .map((i) => i.productId)

      const [userMap, productList] = await Promise.all([
        relation?.user ? UserService.getMap() : <Record<string, User>>{},
        relation?.prescriptionSampleItemList?.product
          ? ProductService.list({ filter: { id: { IN: productIdList } } })
          : <Product[]>[],
      ])

      const productMap = ESArray.arrayToKeyValue(productList, 'id')

      prescriptionSampleList.forEach((prescriptionSample) => {
        if (relation?.user) {
          prescriptionSample.user = userMap[prescriptionSample.userId]
        }
        if (relation?.prescriptionSampleItemList?.product) {
          prescriptionSample.prescriptionSampleItemList.forEach((psi) => {
            psi.product = productMap[psi.productId]
          })
        }
      })
    } catch (error) {
      console.log('🚀 ~ prescription-sample.service.ts:95 ~ executeRelation ~ error:', error)
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
      prescriptionSampleList: data,
      total: dataQuery.length,
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

  static async detail(
    id: string,
    query: PrescriptionSampleDetailQuery = {},
    options?: { refetch?: boolean; query?: boolean },
  ) {
    let prescriptionSample: PrescriptionSample | undefined
    if (options?.query) {
      prescriptionSample = await PrescriptionSampleApi.detail(id, query)
      Object.assign(
        PrescriptionSampleService.prescriptionSampleMap.value[id] || {},
        prescriptionSample,
      )
    } else {
      await PrescriptionSampleService.fetchAll({ refetch: !!options?.refetch })
      prescriptionSample = PrescriptionSampleService.prescriptionSampleMap.value[id]
    }
    if (query.relation && prescriptionSample) {
      await PrescriptionSampleService.executeRelation([prescriptionSample], query.relation)
    }
    return prescriptionSample
      ? PrescriptionSample.from(prescriptionSample)
      : PrescriptionSample.blank()
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

  static async createOne(body: {
    prescriptionSampleBody: PrescriptionSample
    prescriptionSampleItemBodyList: PrescriptionSampleItem[]
  }) {
    const result = await PrescriptionSampleApi.createOne(body)
    PrescriptionSampleService.loadedAll = false
  }

  static async updateOne(
    id: string,
    body: {
      prescriptionSampleBody?: PrescriptionSample
      prescriptionSampleItemBodyList?: PrescriptionSampleItem[]
    },
  ) {
    const result = await PrescriptionSampleApi.updateOne(id, body)
    PrescriptionSampleService.loadedAll = false
    return result
  }

  static async destroyOne(id: string) {
    await PrescriptionSampleApi.destroyOne(id)
    PrescriptionSampleService.loadedAll = false
  }
}
