import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import { ICD } from './icd.model'

export class ICDApi {
  static async all() {
    const response = await AxiosInstance.get('/icd/all')
    const { data } = response.data as FullResponse<{ icdAll: any[] }>
    return ICD.fromList(data.icdAll)
  }
}
