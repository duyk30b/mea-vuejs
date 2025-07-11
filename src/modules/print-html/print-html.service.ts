import { AlertStore } from '@/common/vue-alert'
import { ref } from 'vue'
import { ESArray, ESDom } from '../../utils'
import { MeService } from '../_me/me.service'
import type { Organization } from '../organization'
import { Radiology } from '../radiology'
import type { TicketLaboratoryGroup } from '../ticket-laboratory-group'
import type { TicketRadiology } from '../ticket-radiology'
import { PrintHtmlApi } from './print-html.api'
import { compiledTemplatePrintHtml } from './print-html.compiled'
import type { PrintHtmlGetListQuery } from './print-html.dto'
import { PrintHtml } from './print-html.model'

export class PrintHtmlService {
  static loadedAll: boolean = false
  static printHtmlAll: PrintHtml[] = []
  static printHtmlMap = ref<Record<string, PrintHtml>>({})

  static fetchAll = (() => {
    const start = async () => {
      try {
        const { data } = await PrintHtmlApi.getList({})
        const printHtmlAll = data
        PrintHtmlService.printHtmlAll = printHtmlAll
        PrintHtmlService.printHtmlMap.value = ESArray.arrayToKeyValue(printHtmlAll, 'id')
      } catch (error: any) {
        console.log('🚀 ~ print-html.service.ts:27 ~ PrintHtmlService ~ start ~ error:', error)
      }
    }
    let fetching: any = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetching || !PrintHtmlService.loadedAll || options.refetch) {
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

  static async getMap(options?: { refetch: boolean }) {
    await PrintHtmlService.fetchAll({ refetch: !!options?.refetch })
    return PrintHtmlService.printHtmlMap.value
  }

  static async getList(options?: { refetch: boolean }) {
    await PrintHtmlService.fetchAll({ refetch: !!options?.refetch })
    return PrintHtmlService.printHtmlAll
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

  static async getPrintHtmlProcedureRequest() {
    let printHtmlTemp: PrintHtml | undefined

    let printHtmlId = MeService.settingMap.value.PRINT_SETTING.procedureRequest.printHtmlId
    if (printHtmlId != 0) {
      printHtmlTemp = await PrintHtmlService.detail(printHtmlId)
      if (!printHtmlTemp || !printHtmlTemp.html) {
        printHtmlId = 0
      }
    }
    if (printHtmlId == 0) {
      printHtmlId = MeService.settingMapRoot.value.PRINT_SETTING.procedureRequest.printHtmlId
      printHtmlTemp = await PrintHtmlService.detail(printHtmlId)
    }

    return printHtmlTemp ? PrintHtml.from(printHtmlTemp) : PrintHtml.blank()
  }

  static async getPrintHtmlLaboratoryRequest() {
    let printHtmlTemp: PrintHtml | undefined

    let printHtmlId = MeService.settingMap.value.PRINT_SETTING.laboratoryRequest.printHtmlId
    if (printHtmlId != 0) {
      printHtmlTemp = await PrintHtmlService.detail(printHtmlId)
      if (!printHtmlTemp || !printHtmlTemp.html) {
        printHtmlId = 0
      }
    }
    if (printHtmlId == 0) {
      printHtmlId = MeService.settingMapRoot.value.PRINT_SETTING.laboratoryRequest.printHtmlId
      printHtmlTemp = await PrintHtmlService.detail(printHtmlId)
    }

    return printHtmlTemp ? PrintHtml.from(printHtmlTemp) : PrintHtml.blank()
  }

  static async getPrintHtmlLaboratoryResult(printHtmlId: number) {
    let printHtmlTemp: PrintHtml | undefined
    if (printHtmlId != 0) {
      printHtmlTemp = await PrintHtmlService.detail(printHtmlId)
      if (!printHtmlTemp || !printHtmlTemp.html) {
        printHtmlId = 0
      }
    }

    if (printHtmlId == 0) {
      printHtmlId = MeService.settingMap.value.PRINT_SETTING.laboratoryResult.printHtmlId
      printHtmlTemp = await PrintHtmlService.detail(printHtmlId)
      if (!printHtmlTemp || !printHtmlTemp.html) {
        printHtmlId = 0
      }
    }
    if (printHtmlId == 0) {
      printHtmlId = MeService.settingMapRoot.value.PRINT_SETTING.laboratoryResult.printHtmlId
      printHtmlTemp = await PrintHtmlService.detail(printHtmlId)
    }

    return printHtmlTemp ? PrintHtml.from(printHtmlTemp) : PrintHtml.blank()
  }

  static async getPrintHtmlRadiologyRequest() {
    let printHtmlTemp: PrintHtml | undefined

    let printHtmlId = MeService.settingMap.value.PRINT_SETTING.radiologyRequest.printHtmlId
    if (printHtmlId != 0) {
      printHtmlTemp = await PrintHtmlService.detail(printHtmlId)
      if (!printHtmlTemp || !printHtmlTemp.html) {
        printHtmlId = 0
      }
    }

    if (printHtmlId == 0) {
      printHtmlId = MeService.settingMapRoot.value.PRINT_SETTING.radiologyRequest.printHtmlId
      printHtmlTemp = await PrintHtmlService.detail(printHtmlId)
    }

    return printHtmlTemp ? PrintHtml.from(printHtmlTemp) : PrintHtml.blank()
  }

  static async getPrintHtmlRadiologyResult(printHtmlId: number) {
    let printHtmlTemp: PrintHtml | undefined
    if (printHtmlId != 0) {
      printHtmlTemp = await PrintHtmlService.detail(printHtmlId)
      if (!printHtmlTemp || !printHtmlTemp.html) {
        printHtmlId = 0
      }
    }

    if (printHtmlId == 0) {
      printHtmlId = MeService.settingMap.value.PRINT_SETTING.radiologyResult.printHtmlId
      printHtmlTemp = await PrintHtmlService.detail(printHtmlId)
      if (!printHtmlTemp || !printHtmlTemp.html) {
        printHtmlId = 0
      }
    }
    if (printHtmlId == 0) {
      printHtmlId = MeService.settingMapRoot.value.PRINT_SETTING.radiologyResult.printHtmlId
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

  static async startPrintResultTicketRadiology(options: {
    organization: Organization
    ticketRadiologyData: TicketRadiology
  }) {
    const { organization, ticketRadiologyData } = options
    try {
      const radiologyData = ticketRadiologyData.radiology || Radiology.blank()
      let printHtmlId = radiologyData.printHtmlId
      const printHtmlHeader = await PrintHtmlService.getPrintHtmlHeader()
      const printHtmlRadiology = await PrintHtmlService.getPrintHtmlRadiologyResult(printHtmlId)

      if (!printHtmlHeader || !printHtmlRadiology || !printHtmlRadiology.html) {
        return AlertStore.addError('Cài đặt in thất bại')
      }

      const compiledHeader = compiledTemplatePrintHtml({
        organization,
        ticket: ticketRadiologyData.ticket!,
        masterData: {
          customer: ticketRadiologyData.customer!,
        },
        data: ticketRadiologyData,
        printHtml: printHtmlHeader,
        customVariables: radiologyData.customVariables || '',
      })
      const compiledContent = compiledTemplatePrintHtml({
        organization,
        ticket: ticketRadiologyData.ticket!,
        masterData: {
          customer: ticketRadiologyData.customer!,
        },
        data: ticketRadiologyData,
        printHtml: printHtmlRadiology,
        _LAYOUT: {
          HEADER: compiledHeader.html,
        },
        customVariables: radiologyData.customVariables || '',
      })

      if (!compiledContent.html) {
        AlertStore.addError('Mẫu in không hợp lệ')
        return
      }

      await ESDom.startPrint('iframe-print', {
        html: compiledContent.html,
        cssList: [compiledHeader.css, compiledContent.css, radiologyData.customStyles],
      })
    } catch (error) {
      console.log('🚀 ~ file: VisitPrescription.vue:153 ~ startPrint ~ error:', error)
    }
  }

  static async startPrintResultTicketLaboratory(options: {
    organization: Organization
    ticketLaboratoryGroupData: TicketLaboratoryGroup
  }) {
    const { organization, ticketLaboratoryGroupData } = options
    try {
      let printHtmlId = ticketLaboratoryGroupData.laboratoryGroup?.printHtmlId || 0
      const printHtmlHeader = await PrintHtmlService.getPrintHtmlHeader()
      const printHtmlLaboratory = await PrintHtmlService.getPrintHtmlLaboratoryResult(printHtmlId)

      if (!printHtmlHeader || !printHtmlLaboratory || !printHtmlLaboratory.html) {
        return AlertStore.addError('Cài đặt in thất bại')
      }

      const compiledHeader = compiledTemplatePrintHtml({
        organization,
        ticket: ticketLaboratoryGroupData.ticket!,
        masterData: {
          customer: ticketLaboratoryGroupData.customer!,
        },
        data: {
          ticketLaboratoryGroup: ticketLaboratoryGroupData,
        },
        printHtml: printHtmlHeader,
      })
      const compiledContent = compiledTemplatePrintHtml({
        organization: organization,
        ticket: ticketLaboratoryGroupData.ticket!,
        masterData: {
          customer: ticketLaboratoryGroupData.customer!,
        },
        data: {
          ticketLaboratoryGroup: ticketLaboratoryGroupData,
        },
        printHtml: printHtmlLaboratory,
        _LAYOUT: {
          HEADER: compiledHeader.html,
        },
      })

      if (!compiledContent.html) {
        AlertStore.addError('Mẫu in không hợp lệ')
        return
      }

      await ESDom.startPrint('iframe-print', {
        html: compiledContent.html,
        cssList: [compiledHeader.css, compiledContent.css],
      })
    } catch (error) {
      console.log('🚀 ~ file: TicketClinicLaboratory.vue:137 ~ startPrint ~ error:', error)
    }
  }
}
