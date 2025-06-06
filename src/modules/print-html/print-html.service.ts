import { ESArray } from '../../utils'
import { MeService } from '../_me/me.service'
import { PrintHtmlApi } from './print-html.api'
import type { PrintHtmlGetListQuery } from './print-html.dto'
import { PrintHtml } from './print-html.model'

export class PrintHtmlService {
  static loadedAll: boolean = false
  static printHtmlAll: PrintHtml[] = []

  static fetchAll = (() => {
    const start = async () => {
      try {
        const { data } = await PrintHtmlApi.getList({})
        PrintHtmlService.printHtmlAll = data
      } catch (error: any) {
        console.log('🚀 ~ file: warehouse.service.ts:20 ~ PrintHtmlService ~ start ~ error:', error)
      }
    }
    let fetching: any = null
    return async (options: { refresh?: boolean } = {}) => {
      if (!fetching || !PrintHtmlService.loadedAll || options.refresh) {
        PrintHtmlService.loadedAll = true
        fetching = start()
      }
      await fetching
    }
  })()

  static async list(options: PrintHtmlGetListQuery) {
    await PrintHtmlService.fetchAll()
    return PrintHtml.fromList(PrintHtmlService.printHtmlAll)
  }

  static async getMap() {
    await PrintHtmlService.fetchAll()
    const printHtmlMap = ESArray.arrayToKeyValue(PrintHtmlService.printHtmlAll, 'id')
    return printHtmlMap
  }

  static async detail(id: number) {
    await PrintHtmlService.fetchAll()
    return PrintHtmlService.printHtmlAll.find((i) => {
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

  static async getPrintHtmlHeader() {
    let printHtml: PrintHtml | undefined

    let printHtmlId = MeService.settingMap.value.PRINT_SETTING._LAYOUT_HEADER.printHtmlId
    if (printHtmlId != 0) {
      printHtml = await PrintHtmlService.detail(printHtmlId)
      if (!printHtml || !printHtml.html) {
        printHtmlId = 0
      }
    }
    if (printHtmlId == 0) {
      printHtmlId = MeService.settingMapRoot.value.PRINT_SETTING._LAYOUT_HEADER.printHtmlId
      printHtml = await PrintHtmlService.detail(printHtmlId)
    }

    return printHtml ? PrintHtml.from(printHtml) : PrintHtml.blank()
  }

  static async getPrintHtmlOptometry() {
    let printHtml: PrintHtml | undefined

    let printHtmlId = MeService.settingMap.value.PRINT_SETTING.optometry.printHtmlId
    if (printHtmlId != 0) {
      printHtml = await PrintHtmlService.detail(printHtmlId)
      if (!printHtml || !printHtml.html) {
        printHtmlId = 0
      }
    }
    if (printHtmlId == 0) {
      printHtmlId = MeService.settingMapRoot.value.PRINT_SETTING.optometry.printHtmlId
      printHtml = await PrintHtmlService.detail(printHtmlId)
    }

    return printHtml ? PrintHtml.from(printHtml) : PrintHtml.blank()
  }

  static async getPrintHtmlLaboratory(printHtmlId: number) {
    let printHtmlTemp: PrintHtml | undefined
    if (printHtmlId != 0) {
      printHtmlTemp = await PrintHtmlService.detail(printHtmlId)
      if (!printHtmlTemp || !printHtmlTemp.html) {
        printHtmlId = 0
      }
    }

    if (printHtmlId == 0) {
      printHtmlId = MeService.settingMap.value.PRINT_SETTING.laboratory.printHtmlId
      printHtmlTemp = await PrintHtmlService.detail(printHtmlId)
      if (!printHtmlTemp || !printHtmlTemp.html) {
        printHtmlId = 0
      }
    }
    if (printHtmlId == 0) {
      printHtmlId = MeService.settingMapRoot.value.PRINT_SETTING.laboratory.printHtmlId
      printHtmlTemp = await PrintHtmlService.detail(printHtmlId)
    }

    return printHtmlTemp ? PrintHtml.from(printHtmlTemp) : PrintHtml.blank()
  }

  static async getPrintHtmlRadiology(printHtmlId: number) {
    let printHtmlTemp: PrintHtml | undefined
    if (printHtmlId != 0) {
      printHtmlTemp = await PrintHtmlService.detail(printHtmlId)
      if (!printHtmlTemp || !printHtmlTemp.html) {
        printHtmlId = 0
      }
    }

    if (printHtmlId == 0) {
      printHtmlId = MeService.settingMap.value.PRINT_SETTING.radiology.printHtmlId
      printHtmlTemp = await PrintHtmlService.detail(printHtmlId)
      if (!printHtmlTemp || !printHtmlTemp.html) {
        printHtmlId = 0
      }
    }
    if (printHtmlId == 0) {
      printHtmlId = MeService.settingMapRoot.value.PRINT_SETTING.radiology.printHtmlId
      printHtmlTemp = await PrintHtmlService.detail(printHtmlId)
    }

    return printHtmlTemp ? PrintHtml.from(printHtmlTemp) : PrintHtml.blank()
  }

  static async getPrintHtmlInvoice() {
    let printHtml: PrintHtml | undefined

    let printHtmlId = MeService.settingMap.value.PRINT_SETTING.invoice.printHtmlId
    if (printHtmlId != 0) {
      printHtml = await PrintHtmlService.detail(printHtmlId)
      if (!printHtml || !printHtml.html) {
        printHtmlId = 0
      }
    }
    if (printHtmlId == 0) {
      printHtmlId = MeService.settingMapRoot.value.PRINT_SETTING.invoice.printHtmlId
      printHtml = await PrintHtmlService.detail(printHtmlId)
    }

    return printHtml ? PrintHtml.from(printHtml) : PrintHtml.blank()
  }

  static async getPrintHtmlPrescription() {
    let printHtml: PrintHtml | undefined

    let printHtmlId = MeService.settingMap.value.PRINT_SETTING.prescription.printHtmlId
    if (printHtmlId != 0) {
      printHtml = await PrintHtmlService.detail(printHtmlId)
      if (!printHtml || !printHtml.html) {
        printHtmlId = 0
      }
    }
    if (printHtmlId == 0) {
      printHtmlId = MeService.settingMapRoot.value.PRINT_SETTING.prescription.printHtmlId
      printHtml = await PrintHtmlService.detail(printHtmlId)
    }

    return printHtml ? PrintHtml.from(printHtml) : PrintHtml.blank()
  }
}
