import { arrayToKeyValue, ESString } from '../../utils'
import { useSettingStore } from '../_me/setting.store'
import { PaymentApi } from '../payment/payment.api'
import { DistributorApi } from './distributor.api'
import type {
  DistributorDetailQuery,
  DistributorGetQuery,
  DistributorListQuery,
  DistributorPaginationQuery,
} from './distributor.dto'
import { Distributor } from './distributor.model'

export class DistributorService {
  static loadedAll: boolean = false
  static distributorAll: Distributor[] = []
  static distributorDefault = Distributor.blank()

  // chỉ cho phép gọi 1 lần, nếu muốn gọi lại thì phải dùng loadedAll
  static getAll = (() => {
    const start = async () => {
      try {
        const { distributorList } = await DistributorApi.list({})
        DistributorService.distributorAll = distributorList
      } catch (error: any) {
        console.log('🚀 ~ file: distributor.service.ts:33 ~ :', error)
      }
    }
    let fetching: any = null
    return async (options: { refresh?: boolean } = {}) => {
      if (!fetching || !DistributorService.loadedAll || options.refresh) {
        DistributorService.loadedAll = true
        fetching = start()
      }
      await fetching
    }
  })()

  static async getMap() {
    await DistributorService.getAll()
    return arrayToKeyValue(DistributorService.distributorAll, 'id')
  }

  private static executeQuery(all: Distributor[], query: DistributorGetQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        if (filter.isActive != null) {
          if (filter.isActive !== i.isActive) {
            return false
          }
        }
        if (filter.$OR && filter.$OR.length === 2) {
          if (
            !ESString.customFilter(i.fullName || '', filter.$OR[0].fullName.LIKE, 2) &&
            !ESString.customFilter(i.phone || '', filter.$OR[1].phone.LIKE, 2)
          ) {
            return false
          }
        }
        return true
      })
    }
    if (query.sort) {
      if (query.sort?.id) {
        data.sort((a, b) => {
          if (query.sort?.id === 'ASC') return a.id < b.id ? -1 : 1
          if (query.sort?.id === 'DESC') return a.id > b.id ? -1 : 1
          return a.id > b.id ? -1 : 1
        })
      }
      if (query.sort?.debt) {
        data.sort((a, b) => {
          if (query.sort?.debt === 'ASC') return a.debt < b.debt ? -1 : 1
          if (query.sort?.debt === 'DESC') return a.debt > b.debt ? -1 : 1
          return a.debt > b.debt ? -1 : 1
        })
      }
      if (query.sort?.fullName) {
        data.sort((a, b) => {
          if (query.sort?.fullName === 'ASC') return a.fullName < b.fullName ? -1 : 1
          if (query.sort?.fullName === 'DESC') return a.fullName > b.fullName ? -1 : 1
          return a.fullName > b.fullName ? -1 : 1
        })
      }
    }
    return data
  }

  static async pagination(options: DistributorPaginationQuery) {
    const page = options.page || 1
    const limit = options.limit || 10
    await DistributorService.getAll()
    const dataQuery = DistributorService.executeQuery(DistributorService.distributorAll, options)
    const data = dataQuery.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { total: dataQuery.length },
    }
  }

  static async list(options: DistributorListQuery) {
    await DistributorService.getAll()
    const data = DistributorService.executeQuery(DistributorService.distributorAll, options)
    return Distributor.fromList(data)
  }

  static async search(text: string) {
    await DistributorService.getAll()
    if (!text) text = ''
    const data = DistributorService.distributorAll.filter((i) => {
      if (ESString.customFilter(i.fullName || '', text, 2)) {
        return true
      }
      if (ESString.customFilter(i.phone || '', text, 2)) {
        return true
      }
      return false
    })
    return Distributor.fromList(data)
  }

  static async detail(distributorId: number, options: DistributorDetailQuery = {}) {
    const result = await DistributorApi.detail(distributorId, options)
    const findIndex = DistributorService.distributorAll.findIndex((i) => {
      return i.id === distributorId
    })
    if (findIndex !== -1) {
      DistributorService.distributorAll[findIndex] = result
    }
    return result
  }

  static async createOne(distributor: Distributor) {
    const result = await DistributorApi.createOne(distributor)
    DistributorService.loadedAll = false
    return result
  }

  static async updateOne(id: number, distributor: Distributor) {
    const result = await DistributorApi.updateOne(id, distributor)
    DistributorService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await DistributorApi.destroyOne(id)
    if (result.success) {
      DistributorService.loadedAll = false
    }
    return result
  }

  static async getDistributorDefault() {
    const idDefault = useSettingStore().SCREEN_PURCHASE_ORDER_UPSERT.distributor.idDefault

    if (idDefault) {
      await DistributorService.getAll()
      if (!DistributorService.distributorDefault.id) {
        try {
          const distributor = DistributorService.distributorAll.find((i) => i.id === idDefault)
          if (distributor) {
            this.distributorDefault = distributor
          } else {
            this.distributorDefault = Distributor.blank()
          }
        } catch (error) {
          console.log('🚀 distributor.service.ts:144 ~ getDistributorDefault ~ error:', error)
          this.distributorDefault = Distributor.blank()
        }
      }
    } else {
      this.distributorDefault = Distributor.blank()
    }
    return this.distributorDefault
  }
}
