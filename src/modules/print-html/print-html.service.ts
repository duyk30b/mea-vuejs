import { PrintHtmlApi } from './print-html.api'
import { PrintHtml } from './print-html.model'

export class PrintHtmlService {
  static loadedAll: boolean = false
  static printHtmlAll: PrintHtml[] = []

  static loadedExample = false
  static printHtmlExampleList: PrintHtml[] = []

  static async getAll() {
    if (!PrintHtmlService.loadedAll) {
      const fetchData = await PrintHtmlApi.getList({})
      PrintHtmlService.printHtmlAll = fetchData.data
      PrintHtmlService.loadedAll = true
    }

    return PrintHtml.fromList(PrintHtmlService.printHtmlAll)
  }

  static async getExampleList() {
    if (!PrintHtmlService.loadedExample) {
      PrintHtmlService.printHtmlExampleList = await PrintHtmlApi.exampleList()
      PrintHtmlService.loadedExample = true
    }

    return PrintHtmlService.printHtmlExampleList
  }

  static async detail(id: number) {
    await Promise.all([PrintHtmlService.getAll(), PrintHtmlService.getExampleList()])
    return [...PrintHtmlService.printHtmlAll, ...PrintHtmlService.printHtmlExampleList].find(
      (i) => {
        return i.id === id
      }
    )
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
