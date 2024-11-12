import { PrintHtmlApi } from './print-html.api'
import { PrintHtmlGetOneQuery } from './print-html.dto'
import type { PrintHtml, PrintHtmlType } from './print-html.model'

export class PrintHtmlService {
  static printHtmlMap: Record<string, PrintHtml | null> = {}

  static async findOneBy(options: { type: keyof typeof PrintHtmlType; paraclinicalId: number }) {
    const { type, paraclinicalId } = options
    const key = `${type}_${paraclinicalId}`
    if (PrintHtmlService.printHtmlMap[key] === undefined) {
      const print = await PrintHtmlApi.getOne({ filter: { type, paraclinicalId } })
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
