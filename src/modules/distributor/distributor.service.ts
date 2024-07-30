import { arrayToKeyValue, DString } from '../../utils'
import { useSettingStore } from '../_me/setting.store'
import { DistributorPaymentApi } from '../distributor-payment/distributor-payment.api'
import type { DistributorPaymentPayDebtBody } from '../distributor-payment/distributor-payment.dto'
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
  static distributorAll: Distributor[]
  static distributorDefault = Distributor.blank()

  static async getAll() {
    if (DistributorService.loadedAll) return
    const { data } = await DistributorApi.list({})
    DistributorService.distributorAll = data
    DistributorService.loadedAll = true
  }

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
            !DString.customFilter(i.fullName || '', filter.$OR[0].fullName.LIKE, 2) &&
            !DString.customFilter(i.phone || '', filter.$OR[1].phone.LIKE, 2)
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
    let data = DistributorService.executeQuery(DistributorService.distributorAll, options)
    data = data.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { total: DistributorService.distributorAll.length },
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
      if (DString.customFilter(i.fullName || '', text, 2)) {
        return true
      }
      if (DString.customFilter(i.phone || '', text, 2)) {
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

  static async payDebt(body: DistributorPaymentPayDebtBody) {
    const response = await DistributorPaymentApi.payDebt(body)
    DistributorService.loadedAll = false
    return response
  }

  static async getDistributorDefault() {
    const idDefault = useSettingStore().SCREEN_RECEIPT_UPSERT.distributor.idDefault

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
