import { AlertStore } from '@/common/vue-alert'
import { ESDom } from '../../utils'
import { MeService } from '../_me/me.service'
import type { Customer } from '../customer'
import type { Payment } from '../payment/payment.model'
import { PrintHtmlSettingService } from '../print-html-setting'
import type { PurchaseOrder } from '../purchase-order'
import type { Ticket } from '../ticket'
import type { TicketLaboratoryGroup } from '../ticket-laboratory'
import type { TicketRadiology } from '../ticket-radiology'
import { PrintHtmlCompile } from './print-html.compiled'
import { PrintHtml, PrintHtmlType } from './print-html.model'
import { PrintHtmlService } from './print-html.service'

export class PrintHtmlAction {
  static async getPrintHtmlByType(options: { oid: number; type: PrintHtmlType; id?: number }) {
    let printHtml: PrintHtml | null | undefined
    if (options.id) {
      // nếu có id thì lấy theo id trước (chấp nhận lấy của oid = 1)
      printHtml = await PrintHtmlService.getOne({
        filter: { printHtmlType: options.type, id: options.id },
      })
    }
    if (!printHtml) {
      // nếu không có id, hoặc có id mà ko lấy được, thì lấy theo mặc định
      const printHtmlSetting = await PrintHtmlSettingService.getOne({
        filter: { oid: options.oid, printHtmlType: options.type },
      })
      if (printHtmlSetting) {
        printHtml = await PrintHtmlService.getOne({
          filter: { printHtmlType: options.type, id: printHtmlSetting.printHtmlId },
        })
      }
    }
    if (!printHtml) {
      // nếu lấy theo mặc định mà vẫn không được thì lấy mặc định của hệ thống
      const printHtmlSettingSystem = await PrintHtmlSettingService.getOne({
        filter: { oid: 1, printHtmlType: options.type },
      })
      if (printHtmlSettingSystem) {
        printHtml = await PrintHtmlService.getOne({
          filter: { printHtmlType: options.type, id: printHtmlSettingSystem.printHtmlId },
        })
      }
    }
    if (!printHtml) {
      // nếu lấy theo hệ thống mà vẫn báo lỗi, thì lấy 1 cái bất kỳ cùng type
      printHtml = await PrintHtmlService.getOne({
        filter: { printHtmlType: options.type },
        sort: { id: 'ASC' },
      })
    }

    return printHtml ? PrintHtml.from(printHtml) : PrintHtml.blank()
  }

  static async startPrintCommon(options: {
    data: Record<string, any>
    printHtmlType: PrintHtmlType
  }) {
    const { data, printHtmlType } = options
    const { organization, user } = MeService
    try {
      const printHtmlHeader = await PrintHtmlAction.getPrintHtmlByType({
        oid: organization.value.id,
        type: PrintHtmlType._HEADER,
      })
      const printHtmlFooter = await PrintHtmlAction.getPrintHtmlByType({
        oid: organization.value.id,
        type: PrintHtmlType._FOOTER,
      })
      const printHtmlWrapper = await PrintHtmlAction.getPrintHtmlByType({
        oid: organization.value.id,
        type: printHtmlType,
      })

      if (!printHtmlHeader || !printHtmlWrapper || !printHtmlWrapper.html) {
        return AlertStore.addError('Cài đặt in thất bại')
      }

      const printHtmlCompiled = PrintHtmlCompile.compilePageHtml({
        data: {
          organization: organization.value,
          me: user.value!,
          ...data,
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

  static async startPrintPurchaseOrderDetail(data: { purchaseOrder: PurchaseOrder }) {
    await PrintHtmlAction.startPrintCommon({
      data,
      printHtmlType: PrintHtmlType.PurchaseOrderDetail,
    })
  }

  static async startPrintParaClinicalRequest(data: { ticket: Ticket; customer: Customer }) {
    await PrintHtmlAction.startPrintCommon({
      data,
      printHtmlType: PrintHtmlType.ParaClinicalRequest,
    })
  }

  static async startPrintAllMoney(data: { ticket: Ticket; customer: Customer }) {
    await PrintHtmlAction.startPrintCommon({ data, printHtmlType: PrintHtmlType.AllMoney })
  }

  static async startPrintPrescription(data: { ticket: Ticket; customer: Customer }) {
    await PrintHtmlAction.startPrintCommon({ data, printHtmlType: PrintHtmlType.Prescription })
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
        oid: organization.value.id,
        type: PrintHtmlType._HEADER,
      })
      const printHtmlFooter = await PrintHtmlAction.getPrintHtmlByType({
        oid: organization.value.id,
        type: PrintHtmlType._FOOTER,
      })
      const printHtmlWrapper = await PrintHtmlAction.getPrintHtmlByType({
        oid: organization.value.id,
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
        oid: organization.value.id,
      })
      const printHtmlFooter = await PrintHtmlAction.getPrintHtmlByType({
        oid: organization.value.id,
        type: PrintHtmlType._FOOTER,
      })
      const printHtmlWrapper = await PrintHtmlAction.getPrintHtmlByType({
        oid: organization.value.id,
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

  static async startPrintRequestOptometry(options: { ticket: Ticket; customer: Customer }) {
    const { customer, ticket } = options
    const { organization, user } = MeService
    try {
      const printHtmlHeader = await PrintHtmlAction.getPrintHtmlByType({
        oid: organization.value.id,
        type: PrintHtmlType._HEADER,
      })
      const printHtmlFooter = await PrintHtmlAction.getPrintHtmlByType({
        oid: organization.value.id,
        type: PrintHtmlType._FOOTER,
      })
      const printHtmlWrapper = await PrintHtmlAction.getPrintHtmlByType({
        oid: organization.value.id,
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

  static async startPrintCustomerPayment(data: { customer: Customer; payment: Payment }) {
    await PrintHtmlAction.startPrintCommon({
      data,
      printHtmlType: PrintHtmlType.CustomerPayment,
    })
  }

  static async startPrintCustomerRefund(data: { customer: Customer; payment: Payment }) {
    await PrintHtmlAction.startPrintCommon({
      data,
      printHtmlType: PrintHtmlType.CustomerRefund,
    })
  }
}
