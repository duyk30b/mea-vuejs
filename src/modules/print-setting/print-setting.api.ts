import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import type { TemplateHtmlType } from '../template-html'
import {
  PrintSettingGetQuery,
  type PrintSettingGetListQuery,
} from './print-setting.dto'
import { PrintSetting } from './print-setting.model'

export class PrintSettingApi {
  static async getList(options: PrintSettingGetListQuery) {
    const params = PrintSettingGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/print-setting/list', { params })
    const { data, time } = response.data as FullResponse<{ printSettingList: any[] }>
    return {
      printSettingList: PrintSetting.fromList(data.printSettingList),
    }
  }

  static async replaceAll(body: {
    replaceAll: { id: number; templateHtmlType: TemplateHtmlType; templateHtmlId: number }[]
  }) {
    const response = await AxiosInstance.post('/print-setting/replace-all', body)
    const { data } = response.data as FullResponse
    return
  }
}
