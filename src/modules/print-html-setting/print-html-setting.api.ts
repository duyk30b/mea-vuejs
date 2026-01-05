import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { PrintHtmlType } from '../print-html/print-html.model'
import {
  PrintHtmlSettingGetQuery,
  type PrintHtmlSettingGetListQuery,
} from './print-html-setting.dto'
import { PrintHtmlSetting } from './print-html-setting.model'

export class PrintHtmlSettingApi {
  static async getList(options: PrintHtmlSettingGetListQuery) {
    const params = PrintHtmlSettingGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/print-html-setting/list', { params })
    const { data, time } = response.data as BaseResponse<{ printHtmlSettingList: any[] }>
    return {
      printHtmlSettingList: PrintHtmlSetting.fromList(data.printHtmlSettingList),
    }
  }

  static async replaceAll(body: {
    replaceAll: { id: number; printHtmlType: PrintHtmlType; printHtmlId: number }[]
  }) {
    const response = await AxiosInstance.post('/print-html-setting/replace-all', body)
    const { data } = response.data as BaseResponse
    return
  }
}
