import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { CustomerDB } from '../../core/indexed-db/repository/customer.repository'
import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { throttleAsync } from '../../utils'
import { useMeStore } from '../_me/me.store'
import { useSettingStore } from '../_me/setting.store'
import { AuthService } from '../auth/auth.service'
import { CustomerPaymentApi } from '../customer-payment/customer-payment.api'
import type { CustomerPaymentPayDebtBody } from '../customer-payment/customer-payment.dto'
import { CustomerApi } from './customer.api'
import type { CustomerListQuery, CustomerPaginationQuery } from './customer.dto'
import { Customer } from './customer.model'

export class CustomerService {
  static customerDefault = Customer.blank()

  static refreshDB: () => Promise<{ numberChange: number }> = throttleAsync(
    async (params) => {
      try {
        let refreshTime = await RefreshTimeDB.findOneByCode('CUSTOMER')
        if (!refreshTime) {
          refreshTime = { code: 'CUSTOMER', dataVersion: 0, time: new Date(0).toISOString() }
        }
        const dataVersion = useMeStore().organization.dataVersionParse.customer

        let apiResponse: { time: Date; data: Customer[] }

        if (refreshTime.dataVersion !== dataVersion) {
          await CustomerDB.truncate()
          apiResponse = await CustomerApi.list({})
        } else {
          const lastTime = new Date(refreshTime.time)
          apiResponse = await CustomerApi.list({
            filter: { updatedAt: { GTE: lastTime } },
          })
        }

        if (apiResponse.data.length) {
          await CustomerDB.upsertMany(apiResponse.data)
          refreshTime.time = apiResponse.time.toISOString()
          refreshTime.dataVersion = dataVersion
          await RefreshTimeDB.upsertOne(refreshTime)
        }

        return { numberChange: apiResponse.data.length }
      } catch (error: any) {
        console.log('🚀 ~ file: customer.service.ts:45 ~  ~ refreshDB ~ error:', error)
        AlertStore.add({ type: 'error', message: error.message })
        AuthService.logout()
        return
      }
    },
    60 * 1000 // 1p sau mới refreshDB 1 lần
  )

  static async pagination(params: CustomerPaginationQuery, options?: { refresh: boolean }) {
    const { filter, page, limit, sort } = params
    if (options?.refresh) {
      await CustomerService.refreshDB()
    }
    const result = await CustomerDB.pagination({
      page: page || 1,
      limit: limit || 10,
      condition: {
        isActive: filter?.isActive,
        debt: filter?.debt,
        $OR: filter?.searchText
          ? [{ phone: { LIKE: filter?.searchText } }, { fullName: { LIKE: filter?.searchText } }]
          : undefined,
      },
      sort: sort || { id: 'DESC' },
    })
    return {
      total: result.total,
      page: result.page,
      limit: result.limit,
      data: Customer.fromList(result.data),
    }
  }

  static async list(params: CustomerListQuery, options?: { refresh: boolean }) {
    if (options?.refresh) {
      await CustomerService.refreshDB()
    }
    const { filter, limit, sort } = params
    const objects = await CustomerDB.findMany({
      limit,
      condition: {
        isActive: filter?.isActive,
        debt: filter?.debt,
        $OR: filter?.searchText
          ? [{ phone: { LIKE: filter?.searchText } }, { fullName: { LIKE: filter?.searchText } }]
          : undefined,
      },
      sort,
    })
    return Customer.fromList(objects)
  }

  static async search(text: string) {
    if (!text) text = ''
    const objects = await CustomerDB.findManyBy({
      isActive: 1,
      $OR: [{ phone: { LIKE: text } }, { fullName: { LIKE: text } }],
    })
    return Customer.fromList(objects)
  }

  static async detail(id: number) {
    const customer = await CustomerApi.detail(id)
    if (!customer) return null
    await CustomerDB.upsertOne(customer)
    return customer
  }

  static async createOne(instance: Customer) {
    const response = await CustomerApi.createOne(instance)
    await CustomerDB.upsertOne(response)
    return response
  }

  static async updateOne(id: number, instance: Partial<Customer>) {
    const response = await CustomerApi.updateOne(id, instance)
    await CustomerDB.replaceOne(id, response)
    return response
  }

  static async destroyOne(id: number) {
    const response = await CustomerApi.destroyOne(id)
    if (response.success) {
      await CustomerDB.deleteOneByKey(id)
    }
    return response
  }

  static async payDebt(body: CustomerPaymentPayDebtBody) {
    const data = await CustomerPaymentApi.payDebt(body)
    await CustomerDB.replaceOne(data.customer.id, data.customer)
    return data
  }

  static async getCustomerDefault() {
    const idDefault = useSettingStore().SCREEN_INVOICE_UPSERT.customer.idDefault
    if (idDefault) {
      if (!CustomerService.customerDefault.id) {
        try {
          const customer = await CustomerDB.findOneByKey(idDefault)
          if (customer) {
            this.customerDefault = customer
          } else {
            this.customerDefault = Customer.blank()
          }
        } catch (error) {
          console.log('🚀 ~ file: customer.service.ts:136 ~ getCustomerDefault ~ error:', error)
          this.customerDefault = Customer.blank()
        }
      }
    } else {
      this.customerDefault = Customer.blank()
    }
    return this.customerDefault
  }
}
