import { AlertStore } from '@/common/vue-alert'
import { ESDom } from '../../utils'
import { MeService } from '../_me/me.service'
import type { Customer } from '../customer'
import type { Organization } from '../organization'
import type { Payment } from '../payment/payment.model'
import type { Ticket } from '../ticket'
import type { TicketLaboratoryGroup } from '../ticket-laboratory-group'
import type { TicketRadiology } from '../ticket-radiology'
import { PrintHtmlCompile } from './print-html.compiled'
import { PrintHtml } from './print-html.model'
import { PrintHtmlService } from './print-html.service'

export class PrintHtmlAction {
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

  static async getPrintHtmlRequestProcedure() {
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

  static async getPrintHtmlRequestInvoice() {
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

  static async getPrintHtmlCustomerPayment() {
    let printHtml: PrintHtml | undefined

    let printHtmlId = MeService.settingMap.value.PRINT_SETTING.customerPayment.printHtmlId
    if (printHtmlId != 0) {
      printHtml = await PrintHtmlService.detail(printHtmlId)
      if (!printHtml || !printHtml.html) {
        printHtmlId = 0
      }
    }
    if (printHtmlId == 0) {
      printHtmlId = MeService.settingMapRoot.value.PRINT_SETTING.customerPayment.printHtmlId
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

  static async startPrintRequestProcedure(options: {
    organization: Organization
    ticket: Ticket
    customer: Customer
  }) {
    const { organization, customer, ticket } = options
    try {
      const printHtmlHeader = await PrintHtmlAction.getPrintHtmlHeader()
      const printHtmlWrap = await PrintHtmlAction.getPrintHtmlRequestProcedure()

      if (!printHtmlHeader || !printHtmlWrap || !printHtmlWrap.html) {
        return AlertStore.addError('Cài đặt in thất bại')
      }

      const printHtmlCompiled = PrintHtmlCompile.compilePageHtml({
        data: {
          organization,
          ticket,
          customer,
        },
        template: {
          _header: printHtmlHeader.html,
          _content: '',
          _html: printHtmlWrap.html,
        },
        variablesString: [printHtmlHeader.initVariable, printHtmlWrap.initVariable],
      })

      if (!printHtmlCompiled?.htmlString) {
        AlertStore.addError('Mẫu in không hợp lệ')
        return
      }

      await ESDom.startPrint('iframe-print', {
        html: printHtmlCompiled?.htmlString || '',
        cssList: [printHtmlHeader.css, printHtmlWrap.css],
      })
    } catch (error) {
      console.log('🚀 ~ print-html.action.ts:227 ~ PrintHtmlAction ~ error:', error)
    }
  }

  static async startPrintPrescription(options: {
    organization: Organization
    ticket: Ticket
    customer: Customer
  }) {
    const { organization, customer, ticket } = options
    try {
      const printHtmlHeader = await PrintHtmlAction.getPrintHtmlHeader()
      const printHtmlWrap = await PrintHtmlAction.getPrintHtmlPrescription()

      if (!printHtmlHeader || !printHtmlWrap || !printHtmlWrap.html) {
        return AlertStore.addError('Cài đặt in thất bại')
      }

      const printHtmlCompiled = PrintHtmlCompile.compilePageHtml({
        data: {
          organization,
          ticket,
          customer,
        },
        template: {
          _header: printHtmlHeader.html,
          _content: '',
          _html: printHtmlWrap.html,
        },
        variablesString: [printHtmlHeader.initVariable, printHtmlWrap.initVariable],
      })

      if (!printHtmlCompiled?.htmlString) {
        AlertStore.addError('Mẫu in không hợp lệ')
        return
      }

      await ESDom.startPrint('iframe-print', {
        html: printHtmlCompiled?.htmlString || '',
        cssList: [printHtmlHeader.css, printHtmlWrap.css],
      })
    } catch (error) {
      console.log('🚀 ~ print-html.action.ts:227 ~ PrintHtmlAction ~ error:', error)
    }
  }

  static async startPrintRequestTicketLaboratory(options: {
    organization: Organization
    ticket: Ticket
    customer: Customer
  }) {
    const { organization, customer, ticket } = options
    try {
      const printHtmlHeader = await PrintHtmlAction.getPrintHtmlHeader()
      const printHtmlLaboratory = await PrintHtmlAction.getPrintHtmlLaboratoryRequest()

      if (!printHtmlHeader || !printHtmlLaboratory || !printHtmlLaboratory.html) {
        return AlertStore.addError('Cài đặt in thất bại')
      }

      const printHtmlCompiled = PrintHtmlCompile.compilePageHtml({
        data: {
          organization,
          ticket,
          customer,
        },
        template: {
          _header: printHtmlHeader.html,
          _content: '',
          _html: printHtmlLaboratory.html,
        },
        variablesString: [printHtmlHeader.initVariable, printHtmlLaboratory.initVariable],
      })

      if (!printHtmlCompiled?.htmlString) {
        AlertStore.addError('Mẫu in không hợp lệ')
        return
      }

      await ESDom.startPrint('iframe-print', {
        html: printHtmlCompiled?.htmlString || '',
        cssList: [printHtmlHeader.css, printHtmlLaboratory.css],
      })
    } catch (error) {
      console.log('🚀 ~ print-html.action.ts:227 ~ PrintHtmlAction ~ error:', error)
    }
  }

  static async startPrintResultTicketLaboratory(options: {
    organization: Organization
    ticket: Ticket
    customer: Customer
    ticketLaboratoryGroup: TicketLaboratoryGroup
  }) {
    const { ticketLaboratoryGroup } = options
    try {
      let printHtmlId = ticketLaboratoryGroup.laboratoryGroup?.printHtmlId || 0
      const printHtmlHeader = await PrintHtmlAction.getPrintHtmlHeader()
      const printHtmlLaboratory = await PrintHtmlAction.getPrintHtmlLaboratoryResult(printHtmlId)

      if (!printHtmlHeader || !printHtmlLaboratory || !printHtmlLaboratory.html) {
        return AlertStore.addError('Cài đặt in thất bại')
      }

      const printHtmlCompiled = PrintHtmlCompile.compilePageHtml({
        data: {
          organization: options.organization!,
          ticket: options.ticket!,
          customer: options.customer!,
          ticketLaboratoryGroup,
        },
        template: {
          _header: printHtmlHeader.html,
          _content: '',
          _html: printHtmlLaboratory.html,
        },
        variablesString: [printHtmlHeader.initVariable, printHtmlLaboratory.initVariable],
      })

      if (!printHtmlCompiled?.htmlString) {
        AlertStore.addError('Mẫu in không hợp lệ')
        return
      }

      await ESDom.startPrint('iframe-print', {
        html: printHtmlCompiled.htmlString,
        cssList: [printHtmlHeader.css, printHtmlLaboratory.css],
      })
    } catch (error) {
      console.log('🚀 ~ file: TicketClinicLaboratory.vue:137 ~ startPrint ~ error:', error)
    }
  }

  static async startPrintRequestTicketRadiology(options: {
    organization: Organization
    ticket: Ticket
    customer: Customer
  }) {
    const { organization, customer, ticket } = options
    try {
      const printHtmlHeader = await PrintHtmlAction.getPrintHtmlHeader()
      const printHtmlWrapper = await PrintHtmlAction.getPrintHtmlRadiologyRequest()

      if (!printHtmlHeader || !printHtmlWrapper || !printHtmlWrapper.html) {
        return AlertStore.addError('Cài đặt in thất bại')
      }

      const printHtmlCompiled = PrintHtmlCompile.compilePageHtml({
        data: {
          organization,
          ticket,
          customer,
        },
        template: {
          _header: printHtmlHeader.html,
          _content: '',
          _html: printHtmlWrapper.html,
        },
        variablesString: [printHtmlHeader.initVariable, printHtmlWrapper.initVariable],
      })

      if (!printHtmlCompiled?.htmlString) {
        AlertStore.addError('Mẫu in không hợp lệ')
        return
      }

      await ESDom.startPrint('iframe-print', {
        html: printHtmlCompiled?.htmlString || '',
        cssList: [printHtmlHeader.css, printHtmlWrapper.css],
      })
    } catch (error) {
      console.log('🚀 ~ file: VisitPrescription.vue:153 ~ startPrint ~ error:', error)
    }
  }

  static async startPrintResultTicketRadiology(options: {
    organization: Organization
    ticket: Ticket
    customer: Customer
    ticketRadiologyData: TicketRadiology
  }) {
    const { ticketRadiologyData } = options
    try {
      let printHtmlId = ticketRadiologyData.printHtmlId
      const printHtmlHeader = await PrintHtmlAction.getPrintHtmlHeader()
      const printHtmlWrapper = await PrintHtmlAction.getPrintHtmlRadiologyResult(printHtmlId)

      if (!printHtmlHeader || !printHtmlWrapper || !printHtmlWrapper.html) {
        return AlertStore.addError('Cài đặt in thất bại')
      }

      const printHtmlCompiled = PrintHtmlCompile.compilePageHtml({
        data: {
          organization: options.organization,
          ticket: options.ticket,
          customer: options.customer,
          ticketRadiology: ticketRadiologyData,
        },
        template: {
          _header: printHtmlHeader.html,
          _content: ticketRadiologyData.description || '',
          _html: printHtmlWrapper.html,
        },
        variablesString: [
          printHtmlHeader.initVariable,
          printHtmlWrapper.initVariable,
          ticketRadiologyData.customVariables,
        ],
      })

      if (!printHtmlCompiled?.htmlString) {
        AlertStore.addError('Mẫu in không hợp lệ')
        return
      }

      await ESDom.startPrint('iframe-print', {
        html: printHtmlCompiled?.htmlString || '',
        cssList: [printHtmlHeader.css, printHtmlWrapper.css, ticketRadiologyData.customStyles],
      })
    } catch (error) {
      console.log('🚀 ~ print-html.action.ts:406 ~ PrintHtmlAction ~ error:', error)
    }
  }

  static async startPrintRequestInvoice(options: {
    organization: Organization
    ticket: Ticket
    customer: Customer
  }) {
    const { organization, customer, ticket } = options
    try {
      const printHtmlHeader = await PrintHtmlAction.getPrintHtmlHeader()
      const printHtmlWrapper = await PrintHtmlAction.getPrintHtmlRequestInvoice()

      if (!printHtmlHeader || !printHtmlWrapper || !printHtmlWrapper.html) {
        return AlertStore.addError('Cài đặt in thất bại')
      }

      const printHtmlCompiled = PrintHtmlCompile.compilePageHtml({
        data: {
          organization,
          ticket,
          customer,
        },
        template: {
          _header: printHtmlHeader.html,
          _content: '',
          _html: printHtmlWrapper.html,
        },
        variablesString: [printHtmlHeader.initVariable, printHtmlWrapper.initVariable],
      })

      if (!printHtmlCompiled?.htmlString) {
        AlertStore.addError('Mẫu in không hợp lệ')
        return
      }

      await ESDom.startPrint('iframe-print', {
        html: printHtmlCompiled?.htmlString || '',
        cssList: [printHtmlHeader.css, printHtmlWrapper.css],
      })
    } catch (error) {
      console.log('🚀 ~ file: VisitPrescription.vue:153 ~ startPrint ~ error:', error)
    }
  }

  static async startPrintRequestOptometry(options: {
    organization: Organization
    ticket: Ticket
    customer: Customer
  }) {
    const { organization, customer, ticket } = options
    try {
      const printHtmlHeader = await PrintHtmlAction.getPrintHtmlHeader()
      const printHtmlWrapper = await PrintHtmlAction.getPrintHtmlOptometry()

      if (!printHtmlHeader || !printHtmlWrapper || !printHtmlWrapper.html) {
        return AlertStore.addError('Cài đặt in thất bại')
      }

      const printHtmlCompiled = PrintHtmlCompile.compilePageHtml({
        data: {
          organization,
          ticket,
          customer,
        },
        template: {
          _header: printHtmlHeader.html,
          _content: '',
          _html: printHtmlWrapper.html,
        },
        variablesString: [printHtmlHeader.initVariable, printHtmlWrapper.initVariable],
      })

      if (!printHtmlCompiled?.htmlString) {
        AlertStore.addError('Mẫu in không hợp lệ')
        return
      }

      await ESDom.startPrint('iframe-print', {
        html: printHtmlCompiled?.htmlString || '',
        cssList: [printHtmlHeader.css, printHtmlWrapper.css],
      })
    } catch (error) {
      console.log('🚀 ~ file: VisitPrescription.vue:153 ~ startPrint ~ error:', error)
    }
  }

  static async startPrintCustomerPayment(options: {
    organization: Organization
    customer: Customer
    payment: Payment
  }) {
    const { organization, customer, payment } = options
    try {
      const printHtmlHeader = await PrintHtmlAction.getPrintHtmlHeader()
      const printHtmlWrapper = await PrintHtmlAction.getPrintHtmlCustomerPayment()

      if (!printHtmlHeader || !printHtmlWrapper || !printHtmlWrapper.html) {
        return AlertStore.addError('Cài đặt in thất bại')
      }

      const printHtmlCompiled = PrintHtmlCompile.compilePageHtml({
        data: {
          organization,
          customer,
          payment,
        },
        template: {
          _header: printHtmlHeader.html,
          _content: '',
          _html: printHtmlWrapper.html,
        },
        variablesString: [printHtmlHeader.initVariable, printHtmlWrapper.initVariable],
      })

      if (!printHtmlCompiled?.htmlString) {
        AlertStore.addError('Mẫu in không hợp lệ')
        return
      }

      await ESDom.startPrint('iframe-print', {
        html: printHtmlCompiled?.htmlString || '',
        cssList: [printHtmlHeader.css, printHtmlWrapper.css],
      })
    } catch (error) {
      console.log('🚀 ~ file: VisitPrescription.vue:153 ~ startPrint ~ error:', error)
    }
  }
}
