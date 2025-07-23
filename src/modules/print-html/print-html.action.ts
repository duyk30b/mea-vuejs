import { AlertStore } from '@/common/vue-alert'
import { ESDom } from '../../utils'
import { MeService } from '../_me/me.service'
import type { Customer } from '../customer'
import type { Payment } from '../payment/payment.model'
import type { Ticket } from '../ticket'
import type { TicketLaboratoryGroup } from '../ticket-laboratory-group'
import type { TicketRadiology } from '../ticket-radiology'
import { PrintHtmlCompile } from './print-html.compiled'
import { PrintHtml, PrintHtmlType } from './print-html.model'
import { PrintHtmlService } from './print-html.service'

export class PrintHtmlAction {
  static async getPrintHtmlByType(options: { type: PrintHtmlType; id?: number }) {
    const printHtmlAll = await PrintHtmlService.getAll()
    const printHtmlList = printHtmlAll.filter((i) => {
      return i.printHtmlType === options.type || !i.printHtmlType
    })

    let printHtml: PrintHtml | undefined
    if (options.id) {
      printHtml = printHtmlList.find((i) => i.id === options.id)
    }
    if (!printHtml) {
      printHtml = printHtmlList.find((i) => i.oid !== 1 && i.isDefault)
    }
    if (!printHtml) {
      printHtml = printHtmlList.find((i) => i.oid === 1 && i.isDefault)
    }
    if (!printHtml) {
      printHtmlList.sort((a, b) => (a < b ? -1 : 1))
      printHtml = printHtmlList[0]
    }

    return printHtml ? PrintHtml.from(printHtml) : PrintHtml.blank()
  }

  static async startPrintRequestProcedure(options: { ticket: Ticket; customer: Customer }) {
    const { customer, ticket } = options
    const { organization, user } = MeService

    try {
      const printHtmlHeader = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType._HEADER,
      })
      const printHtmlFooter = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType._FOOTER,
      })
      const printHtmlWrapper = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType.ProcedureRequest,
      })

      if (!printHtmlHeader || !printHtmlWrapper || !printHtmlWrapper.html) {
        return AlertStore.addError('Cài đặt in thất bại')
      }

      const printHtmlCompiled = PrintHtmlCompile.compilePageHtml({
        data: {
          organization: organization.value,
          me: user.value!,
          ticket,
          customer,
        },
        template: {
          _header: printHtmlHeader.html,
          _footer: printHtmlFooter.html,
          _wrapper: printHtmlWrapper.html,
          _content: '',
        },
        variablesString: [
          printHtmlHeader.initVariable,
          printHtmlFooter.initVariable,
          printHtmlWrapper.initVariable,
        ],
      })

      if (!printHtmlCompiled?.htmlString) {
        AlertStore.addError('Mẫu in không hợp lệ')
        return
      }

      await ESDom.startPrint('iframe-print', {
        html: printHtmlCompiled?.htmlString || '',
        cssList: [printHtmlHeader.css, printHtmlFooter.css, printHtmlWrapper.css],
      })
    } catch (error) {
      console.log('🚀 ~ print-html.action.ts:227 ~ PrintHtmlAction ~ error:', error)
    }
  }

  static async startPrintPrescription(options: { ticket: Ticket; customer: Customer }) {
    const { customer, ticket } = options
    const { organization, user } = MeService
    try {
      const printHtmlHeader = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType._HEADER,
      })
      const printHtmlFooter = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType._FOOTER,
      })
      const printHtmlWrapper = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType.Prescription,
      })

      if (!printHtmlHeader || !printHtmlWrapper || !printHtmlWrapper.html) {
        return AlertStore.addError('Cài đặt in thất bại')
      }

      const printHtmlCompiled = PrintHtmlCompile.compilePageHtml({
        data: {
          organization: organization.value,
          me: user.value!,
          ticket,
          customer,
        },
        template: {
          _header: printHtmlHeader.html,
          _footer: printHtmlFooter.html,
          _wrapper: printHtmlWrapper.html,
          _content: '',
        },
        variablesString: [
          printHtmlHeader.initVariable,
          printHtmlFooter.initVariable,
          printHtmlWrapper.initVariable,
        ],
      })

      if (!printHtmlCompiled?.htmlString) {
        AlertStore.addError('Mẫu in không hợp lệ')
        return
      }

      await ESDom.startPrint('iframe-print', {
        html: printHtmlCompiled?.htmlString || '',
        cssList: [printHtmlHeader.css, printHtmlFooter.css, printHtmlWrapper.css],
      })
    } catch (error) {
      console.log('🚀 ~ print-html.action.ts:227 ~ PrintHtmlAction ~ error:', error)
    }
  }

  static async startPrintRequestTicketLaboratory(options: { ticket: Ticket; customer: Customer }) {
    const { customer, ticket } = options
    const { organization, user } = MeService
    try {
      const printHtmlHeader = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType._HEADER,
      })
      const printHtmlFooter = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType._FOOTER,
      })
      const printHtmlWrapper = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType.LaboratoryRequest,
      })

      if (!printHtmlHeader || !printHtmlWrapper || !printHtmlWrapper.html) {
        return AlertStore.addError('Cài đặt in thất bại')
      }

      const printHtmlCompiled = PrintHtmlCompile.compilePageHtml({
        data: {
          organization: organization.value,
          me: user.value!,
          ticket,
          customer,
        },
        template: {
          _header: printHtmlHeader.html,
          _footer: printHtmlFooter.html,
          _wrapper: printHtmlWrapper.html,
          _content: '',
        },
        variablesString: [
          printHtmlHeader.initVariable,
          printHtmlFooter.initVariable,
          printHtmlWrapper.initVariable,
        ],
      })

      if (!printHtmlCompiled?.htmlString) {
        AlertStore.addError('Mẫu in không hợp lệ')
        return
      }

      await ESDom.startPrint('iframe-print', {
        html: printHtmlCompiled?.htmlString || '',
        cssList: [printHtmlHeader.css, printHtmlFooter.css, printHtmlWrapper.css],
      })
    } catch (error) {
      console.log('🚀 ~ print-html.action.ts:227 ~ PrintHtmlAction ~ error:', error)
    }
  }

  static async startPrintResultTicketLaboratory(options: {
    ticket: Ticket
    customer: Customer
    ticketLaboratoryGroup: TicketLaboratoryGroup
  }) {
    const { ticketLaboratoryGroup } = options
    const { organization, user } = MeService
    try {
      let printHtmlId = ticketLaboratoryGroup.laboratoryGroup?.printHtmlId || 0
      const printHtmlHeader = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType._HEADER,
      })
      const printHtmlFooter = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType._FOOTER,
      })
      const printHtmlWrapper = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType.LaboratoryResult,
        id: printHtmlId,
      })

      if (!printHtmlHeader || !printHtmlWrapper || !printHtmlWrapper.html) {
        return AlertStore.addError('Cài đặt in thất bại')
      }

      const printHtmlCompiled = PrintHtmlCompile.compilePageHtml({
        data: {
          organization: organization.value,
          me: user.value!,
          ticket: options.ticket!,
          customer: options.customer!,
          ticketLaboratoryGroup,
        },
        template: {
          _header: printHtmlHeader.html,
          _footer: printHtmlFooter.html,
          _wrapper: printHtmlWrapper.html,
          _content: '',
        },
        variablesString: [
          printHtmlHeader.initVariable,
          printHtmlFooter.initVariable,
          printHtmlWrapper.initVariable,
        ],
      })

      if (!printHtmlCompiled?.htmlString) {
        AlertStore.addError('Mẫu in không hợp lệ')
        return
      }

      await ESDom.startPrint('iframe-print', {
        html: printHtmlCompiled.htmlString,
        cssList: [printHtmlHeader.css, printHtmlWrapper.css, printHtmlFooter.css],
      })
    } catch (error) {
      console.log('🚀 ~ file: TicketClinicLaboratory.vue:137 ~ startPrint ~ error:', error)
    }
  }

  static async startPrintRequestTicketRadiology(options: { ticket: Ticket; customer: Customer }) {
    const { customer, ticket } = options
    const { organization, user } = MeService
    try {
      const printHtmlHeader = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType._HEADER,
      })
      const printHtmlFooter = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType._FOOTER,
      })
      const printHtmlWrapper = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType.RadiologyRequest,
      })

      if (!printHtmlHeader || !printHtmlWrapper || !printHtmlWrapper.html) {
        return AlertStore.addError('Cài đặt in thất bại')
      }

      const printHtmlCompiled = PrintHtmlCompile.compilePageHtml({
        data: {
          organization: organization.value,
          me: user.value!,
          ticket,
          customer,
        },
        template: {
          _header: printHtmlHeader.html,
          _footer: printHtmlFooter.html,
          _wrapper: printHtmlWrapper.html,
          _content: '',
        },
        variablesString: [
          printHtmlHeader.initVariable,
          printHtmlWrapper.initVariable,
          printHtmlFooter.initVariable,
        ],
      })

      if (!printHtmlCompiled?.htmlString) {
        AlertStore.addError('Mẫu in không hợp lệ')
        return
      }

      await ESDom.startPrint('iframe-print', {
        html: printHtmlCompiled?.htmlString || '',
        cssList: [printHtmlHeader.css, printHtmlFooter.css, printHtmlWrapper.css],
      })
    } catch (error) {
      console.log('🚀 ~ file: VisitPrescription.vue:153 ~ startPrint ~ error:', error)
    }
  }

  static async startPrintResultTicketRadiology(options: {
    ticket: Ticket
    customer: Customer
    ticketRadiologyData: TicketRadiology
  }) {
    const { ticketRadiologyData } = options
    const { organization, user } = MeService
    try {
      let printHtmlId = ticketRadiologyData.printHtmlId
      const printHtmlHeader = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType._HEADER,
      })
      const printHtmlFooter = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType._FOOTER,
      })
      const printHtmlWrapper = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType.RadiologyResult,
        id: printHtmlId,
      })

      if (!printHtmlHeader || !printHtmlWrapper || !printHtmlWrapper.html) {
        return AlertStore.addError('Cài đặt in thất bại')
      }

      const printHtmlCompiled = PrintHtmlCompile.compilePageHtml({
        data: {
          organization: organization.value,
          me: user.value!,
          ticket: options.ticket,
          customer: options.customer,
          ticketRadiology: ticketRadiologyData,
        },
        template: {
          _header: printHtmlHeader.html,
          _footer: printHtmlFooter.html,
          _wrapper: printHtmlWrapper.html,
          _content: ticketRadiologyData.description || '',
        },
        variablesString: [
          printHtmlHeader.initVariable,
          printHtmlFooter.initVariable,
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
        cssList: [
          printHtmlHeader.css,
          printHtmlFooter.css,
          printHtmlWrapper.css,
          ticketRadiologyData.customStyles,
        ],
      })
    } catch (error) {
      console.log('🚀 ~ print-html.action.ts:406 ~ PrintHtmlAction ~ error:', error)
    }
  }

  static async startPrintRequestInvoice(options: { ticket: Ticket; customer: Customer }) {
    const { customer, ticket } = options
    const { organization, user } = MeService
    try {
      const printHtmlHeader = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType._HEADER,
      })
      const printHtmlFooter = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType._FOOTER,
      })
      const printHtmlWrapper = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType.Invoice,
      })

      if (!printHtmlHeader || !printHtmlWrapper || !printHtmlWrapper.html) {
        return AlertStore.addError('Cài đặt in thất bại')
      }

      const printHtmlCompiled = PrintHtmlCompile.compilePageHtml({
        data: {
          organization: organization.value,
          me: user.value!,
          ticket,
          customer,
        },
        template: {
          _header: printHtmlHeader.html,
          _footer: printHtmlFooter.html,
          _wrapper: printHtmlWrapper.html,
          _content: '',
        },
        variablesString: [printHtmlHeader.initVariable, printHtmlWrapper.initVariable],
      })

      if (!printHtmlCompiled?.htmlString) {
        AlertStore.addError('Mẫu in không hợp lệ')
        return
      }

      await ESDom.startPrint('iframe-print', {
        html: printHtmlCompiled?.htmlString || '',
        cssList: [printHtmlHeader.css, printHtmlFooter.css, printHtmlWrapper.css],
      })
    } catch (error) {
      console.log('🚀 ~ file: VisitPrescription.vue:153 ~ startPrint ~ error:', error)
    }
  }

  static async startPrintRequestOptometry(options: { ticket: Ticket; customer: Customer }) {
    const { customer, ticket } = options
    const { organization, user } = MeService
    try {
      const printHtmlHeader = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType._HEADER,
      })
      const printHtmlFooter = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType._FOOTER,
      })
      const printHtmlWrapper = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType.Optometry,
      })

      if (!printHtmlHeader || !printHtmlWrapper || !printHtmlWrapper.html) {
        return AlertStore.addError('Cài đặt in thất bại')
      }

      const printHtmlCompiled = PrintHtmlCompile.compilePageHtml({
        data: {
          organization: organization.value,
          me: user.value!,
          ticket,
          customer,
        },
        template: {
          _header: printHtmlHeader.html,
          _footer: printHtmlFooter.html,
          _wrapper: printHtmlWrapper.html,
          _content: '',
        },
        variablesString: [
          printHtmlHeader.initVariable,
          printHtmlWrapper.initVariable,
          printHtmlFooter.initVariable,
        ],
      })

      if (!printHtmlCompiled?.htmlString) {
        AlertStore.addError('Mẫu in không hợp lệ')
        return
      }

      await ESDom.startPrint('iframe-print', {
        html: printHtmlCompiled?.htmlString || '',
        cssList: [printHtmlHeader.css, printHtmlFooter.css, printHtmlWrapper.css],
      })
    } catch (error) {
      console.log('🚀 ~ file: VisitPrescription.vue:153 ~ startPrint ~ error:', error)
    }
  }

  static async startPrintCustomerPayment(options: { customer: Customer; payment: Payment }) {
    const { customer, payment } = options
    const { organization, user } = MeService
    try {
      const printHtmlHeader = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType._HEADER,
      })
      const printHtmlFooter = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType._FOOTER,
      })
      const printHtmlWrapper = await PrintHtmlAction.getPrintHtmlByType({
        type: PrintHtmlType.CustomerPayment,
      })

      if (!printHtmlHeader || !printHtmlWrapper || !printHtmlWrapper.html) {
        return AlertStore.addError('Cài đặt in thất bại')
      }

      const printHtmlCompiled = PrintHtmlCompile.compilePageHtml({
        data: {
          organization: organization.value,
          me: user.value!,
          customer,
          payment,
        },
        template: {
          _header: printHtmlHeader.html,
          _footer: printHtmlFooter.html,
          _wrapper: printHtmlWrapper.html,
          _content: '',
        },
        variablesString: [
          printHtmlHeader.initVariable,
          printHtmlFooter.initVariable,
          printHtmlWrapper.initVariable,
        ],
      })

      if (!printHtmlCompiled?.htmlString) {
        AlertStore.addError('Mẫu in không hợp lệ')
        return
      }

      await ESDom.startPrint('iframe-print', {
        html: printHtmlCompiled?.htmlString || '',
        cssList: [printHtmlHeader.css, printHtmlFooter.css, printHtmlWrapper.css],
      })
    } catch (error) {
      console.log('🚀 ~ file: VisitPrescription.vue:153 ~ startPrint ~ error:', error)
    }
  }
}
