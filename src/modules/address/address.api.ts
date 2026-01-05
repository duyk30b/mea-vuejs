import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Address } from './address.model'

export class AddressApi {
  static async all() {
    const response = await AxiosInstance.get('/address/all')
    const { data } = response.data as BaseResponse<{ addressAll: any[] }>
    return Address.fromList(data.addressAll)
  }

  static async replaceList(options: { addressAll: Address[] }) {
    const response = await AxiosInstance.post(`/address/replace-all`, {
      addressAll: options.addressAll.map((i) => {
        return {
          province: i.province,
          ward: i.ward,
        }
      }),
    })
    const { data } = response.data as BaseResponse
  }
}
