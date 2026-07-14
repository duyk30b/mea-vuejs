import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import {
  CustomerGroupGetQuery,
  type CustomerGroupListQuery
} from './customer_group.dto'
import { CustomerGroup } from './customer_group.model'

export class CustomerGroupApi {
  static async list(options: CustomerGroupListQuery) {
    const params = CustomerGroupGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/customer_group/list', { params })
    const { data, time } = response.data as FullResponse<{ customerGroupList: any[] }>
    return CustomerGroup.fromList(data.customerGroupList)
  }


  static async replaceAll(body: CustomerGroup[]) {
    const response = await AxiosInstance.post('/customer_group/replace-all', {
      customerGroupReplaceAll: body.map((i) => {
        return {
          id: i.id || '0',
          name: i.name,
        }
      }),
    })
    const { data } = response.data as FullResponse
    return data
  }

}
