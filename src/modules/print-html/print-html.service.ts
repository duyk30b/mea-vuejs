import { PrintHtmlApi } from './print-html.api'
import { PrintHtml } from './print-html.model'

export class PrintHtmlService {
  static loadedAll: boolean = false
  static printHtmlAll: PrintHtml[] = []

  static loadedSystem = false
  static printHtmlSystemList: PrintHtml[] = []

  static async getAll() {
    if (!PrintHtmlService.loadedAll) {
      const fetchData = await PrintHtmlApi.getList({})
      PrintHtmlService.printHtmlAll = fetchData.data
      PrintHtmlService.loadedAll = true
    }

    return PrintHtml.fromList(PrintHtmlService.printHtmlAll)
  }

  static async getSystemList() {
    if (!PrintHtmlService.loadedSystem) {
      PrintHtmlService.printHtmlSystemList = await PrintHtmlApi.systemList()
      PrintHtmlService.loadedSystem = true
    }

    return PrintHtmlService.printHtmlSystemList
  }

  static async detail(id: number) {
    await Promise.all([PrintHtmlService.getAll(), PrintHtmlService.getSystemList()])
    return [...PrintHtmlService.printHtmlAll, ...PrintHtmlService.printHtmlSystemList].find((i) => {
      return i.id === id
    })
  }

  static async createOne(printHtml: PrintHtml) {
    const result = await PrintHtmlApi.createOne(printHtml)
    PrintHtmlService.loadedAll = false
    return result
  }

  static async updateOne(id: number, printHtml: PrintHtml) {
    const result = await PrintHtmlApi.updateOne(id, printHtml)
    PrintHtmlService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await PrintHtmlApi.destroyOne(id)
    PrintHtmlService.loadedAll = false
    return result
  }
}
