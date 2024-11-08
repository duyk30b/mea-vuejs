import { PrintHtmlApi } from './print-html.api'
import type { PrintHtml, PrintHtmlType } from './print-html.model'

export class PrintHtmlService {
  static printHtmlMap: Record<string, PrintHtml> = {}

  static async getOneByKey(key: keyof typeof PrintHtmlType) {
    if (PrintHtmlService.printHtmlMap[key] === undefined) {
      const print = await PrintHtmlApi.getOne({ filter: { key } })
      PrintHtmlService.printHtmlMap[key] = print || null
    }
    return PrintHtmlService.printHtmlMap[key]
  }

  static async createOne(printHtml: PrintHtml) {
    return await PrintHtmlApi.createOne(printHtml)
  }

  static async updateOne(id: number, content: string) {
    return await PrintHtmlApi.updateOne(id, content)
  }

  static async destroyOne(id: number) {
    return await PrintHtmlApi.destroyOne(id)
  }
}
