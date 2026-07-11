import { AlertStore } from '@/common/vue-alert'
import { ESDom } from '../../utils'
import { MeService } from '../_me/me.service'
import type { Customer } from '../customer'
import type { Payment } from '../payment/payment.model'
import { PrintSettingService } from '../print-setting'
import type { PurchaseOrder } from '../purchase-order'
import type { Ticket } from '../ticket'
import type { TicketLaboratoryGroup } from '../ticket-laboratory'
import type { TicketRadiology } from '../ticket-radiology'
import { TemplateHtmlCompile } from './template-html.compiled'
import { TemplateHtml, TemplateHtmlType } from './template-html.model'
import { TemplateHtmlService } from './template-html.service'

export class TemplateHtmlAction {
  static async getTemplateHtmlByType(options: {
    oid: number
    templateHtmlType: TemplateHtmlType
    templateHtmlId?: number
  }) {
    const { oid, templateHtmlType, templateHtmlId } = options
    let templateHtml: TemplateHtml | null | undefined
    if (templateHtmlId) {
      // nếu có id thì lấy theo id trước (chấp nhận lấy của oid = 1)
      templateHtml = await TemplateHtmlService.getOne({
        filter: { templateHtmlType, id: templateHtmlId },
      })
    }
    if (!templateHtml) {
      // nếu không có id, hoặc có id mà ko lấy được, thì lấy theo mặc định
      const printSetting = await PrintSettingService.getOne({
        filter: { oid, templateHtmlType },
      })
      if (printSetting && printSetting.templateHtmlId) {
        templateHtml = await TemplateHtmlService.getOne({
          filter: { templateHtmlType, id: printSetting.templateHtmlId },
        })
      }
    }
    if (!templateHtml) {
      // nếu lấy theo mặc định mà vẫn không được thì lấy mặc định của hệ thống
      const printSettingSystem = await PrintSettingService.getOne({
        filter: { oid: 1, templateHtmlType },
      })
      if (printSettingSystem && printSettingSystem.templateHtmlId) {
        templateHtml = await TemplateHtmlService.getOne({
          filter: { templateHtmlType, id: printSettingSystem.templateHtmlId },
        })
      }
    }
    if (!templateHtml) {
      // nếu lấy theo hệ thống mà vẫn báo lỗi, thì lấy 1 cái bất kỳ cùng type
      templateHtml = await TemplateHtmlService.getOne({
        filter: { templateHtmlType },
        sort: { id: 'ASC' },
      })
    }

    return templateHtml ? TemplateHtml.from(templateHtml) : TemplateHtml.blank()
  }

  static async startWriteTicketOrderPreview(options: {
    data: Record<string, any>
    templateHtmlType: TemplateHtmlType
  }) {
    const { data, templateHtmlType } = options
    const { organization, user } = MeService
    const templateHtmlHeaderPreview = await TemplateHtmlAction.getTemplateHtmlByType({
      oid: organization.value.id,
      templateHtmlType: TemplateHtmlType._HEADER_PREVIEW,
    })
    const templateHtmlFooterPreview = await TemplateHtmlAction.getTemplateHtmlByType({
      oid: organization.value.id,
      templateHtmlType: TemplateHtmlType._FOOTER_PREVIEW,
    })
    const templateHtmlWrapper = await TemplateHtmlAction.getTemplateHtmlByType({
      oid: organization.value.id,
      templateHtmlType: templateHtmlType,
    })

    if (!templateHtmlHeaderPreview || !templateHtmlWrapper || !templateHtmlWrapper.htmlPrint) {
      return AlertStore.addError('Cài đặt in thất bại')
    }

    const templateHtmlCompiled = TemplateHtmlCompile.compilePageHtml({
      data: {
        organization: organization.value,
        me: user.value!,
        ...data,
      },
      template: {
        _header: templateHtmlHeaderPreview.htmlPrint,
        _footer: templateHtmlFooterPreview.htmlPrint,
        _wrapper: templateHtmlWrapper.htmlPrint,
        _content: '',
      },
      variablesString: [templateHtmlHeaderPreview.initVariable, templateHtmlWrapper.initVariable],
    })

    if (!templateHtmlCompiled?.htmlString) {
      return AlertStore.addError('Mẫu in không hợp lệ')
    }

    const htmlText = `
        <style>${templateHtmlHeaderPreview.cssPrint}</style>
        <style>${templateHtmlFooterPreview.cssPrint}</style>
        <style>${templateHtmlWrapper.cssPrint}</style>
        ${templateHtmlCompiled?.htmlString || ''}
      `

    return htmlText
  }

  static async startPrintCommon(options: {
    data: Record<string, any>
    templateHtmlType: TemplateHtmlType
    templateHtmlId?: number
  }) {
    const { data, templateHtmlType, templateHtmlId } = options
    const { organization, user } = MeService
    try {
      const templateHtmlHeader = await TemplateHtmlAction.getTemplateHtmlByType({
        oid: organization.value.id,
        templateHtmlType: TemplateHtmlType._HEADER,
      })
      const templateHtmlFooter = await TemplateHtmlAction.getTemplateHtmlByType({
        oid: organization.value.id,
        templateHtmlType: TemplateHtmlType._FOOTER,
      })
      const templateHtmlWrapper = await TemplateHtmlAction.getTemplateHtmlByType({
        oid: organization.value.id,
        templateHtmlType: templateHtmlType,
        templateHtmlId: templateHtmlId,
      })

      if (!templateHtmlHeader || !templateHtmlWrapper || !templateHtmlWrapper.htmlPrint) {
        return AlertStore.addError('Cài đặt in thất bại')
      }

      const templateHtmlCompiled = TemplateHtmlCompile.compilePageHtml({
        data: {
          organization: organization.value,
          me: user.value!,
          ...data,
        },
        template: {
          _header: templateHtmlHeader.htmlPrint,
          _footer: templateHtmlFooter.htmlPrint,
          _wrapper: templateHtmlWrapper.htmlPrint,
          _content: '',
        },
        variablesString: [templateHtmlHeader.initVariable, templateHtmlWrapper.initVariable],
      })

      if (!templateHtmlCompiled?.htmlString) {
        AlertStore.addError('Mẫu in không hợp lệ')
        return
      }

      await ESDom.startPrint('iframe-print', {
        html: templateHtmlCompiled?.htmlString || '',
        cssList: [
          templateHtmlHeader.cssPrint,
          templateHtmlFooter.cssPrint,
          templateHtmlWrapper.cssPrint,
        ],
      })
    } catch (error) {
      console.log('🚀 ~ template-html.action.ts:158 ~ startPrintCommon ~ error:', error)
    }
  }

  static async startPrintPurchaseOrderDetail(data: { purchaseOrder: PurchaseOrder }) {
    await TemplateHtmlAction.startPrintCommon({
      data,
      templateHtmlType: TemplateHtmlType.PurchaseOrderDetail,
    })
  }

  static async startPrintTicketOrderDetail(data: { ticket: Ticket; customer: Customer }) {
    await TemplateHtmlAction.startPrintCommon({
      data,
      templateHtmlType: TemplateHtmlType.TicketOrderDetail,
    })
  }

  static async startPrintTicketClinicDiagnosis(data: {
    ticket: Ticket
    customer: Customer
  }) {
    await TemplateHtmlAction.startPrintCommon({
      data,
      templateHtmlType: TemplateHtmlType.TicketClinicDiagnosis,
    })
  }

  static async startPrintTicketClinicDocumentExtra(data: {
    ticket: Ticket
    customer: Customer
    templateHtmlId: number
  }) {
    await TemplateHtmlAction.startPrintCommon({
      data,
      templateHtmlType: TemplateHtmlType.TicketClinicDocumentExtra,
      templateHtmlId: data.templateHtmlId,
    })
  }

  static async startPrintTicketClinicProcedure(data: { ticket: Ticket; customer: Customer }) {
    await TemplateHtmlAction.startPrintCommon({
      data,
      templateHtmlType: TemplateHtmlType.TicketClinicProcedure,
    })
  }

  static async startPrintTicketClinicPrescription(data: { ticket: Ticket; customer: Customer }) {
    await TemplateHtmlAction.startPrintCommon({
      data,
      templateHtmlType: TemplateHtmlType.TicketClinicPrescription,
    })
  }
  static async startPrintTicketClinicConsumable(data: { ticket: Ticket; customer: Customer }) {
    await TemplateHtmlAction.startPrintCommon({
      data,
      templateHtmlType: TemplateHtmlType.TicketClinicConsumable,
    })
  }

  static async startPrintTicketClinicParaClinicalRequest(data: { ticket: Ticket; customer: Customer }) {
    await TemplateHtmlAction.startPrintCommon({
      data,
      templateHtmlType: TemplateHtmlType.TicketClinicParaClinicalRequest,
    })
  }

  static async startPrintTicketClinicLaboratoryResult(options: {
    ticket: Ticket
    customer: Customer
    ticketLaboratoryGroup: TicketLaboratoryGroup
  }) {
    const { ticketLaboratoryGroup } = options
    const { organization, user } = MeService
    try {
      let templateHtmlId = ticketLaboratoryGroup.laboratoryGroup?.templateHtmlId || 0
      const templateHtmlHeader = await TemplateHtmlAction.getTemplateHtmlByType({
        oid: organization.value.id,
        templateHtmlType: TemplateHtmlType._HEADER,
      })
      const templateHtmlFooter = await TemplateHtmlAction.getTemplateHtmlByType({
        oid: organization.value.id,
        templateHtmlType: TemplateHtmlType._FOOTER,
      })
      const templateHtmlWrapper = await TemplateHtmlAction.getTemplateHtmlByType({
        oid: organization.value.id,
        templateHtmlType: TemplateHtmlType.TicketClinicLaboratoryResult,
        templateHtmlId,
      })

      if (!templateHtmlHeader || !templateHtmlWrapper || !templateHtmlWrapper.htmlPrint) {
        return AlertStore.addError('Cài đặt in thất bại')
      }

      const templateHtmlCompiled = TemplateHtmlCompile.compilePageHtml({
        data: {
          organization: organization.value,
          me: user.value!,
          ticket: options.ticket!,
          customer: options.customer!,
          ticketLaboratoryGroup,
        },
        template: {
          _header: templateHtmlHeader.htmlPrint,
          _footer: templateHtmlFooter.htmlPrint,
          _wrapper: templateHtmlWrapper.htmlPrint,
          _content: '',
        },
        variablesString: [
          templateHtmlHeader.initVariable,
          templateHtmlFooter.initVariable,
          templateHtmlWrapper.initVariable,
        ],
      })

      if (!templateHtmlCompiled?.htmlString) {
        AlertStore.addError('Mẫu in không hợp lệ')
        return
      }

      await ESDom.startPrint('iframe-print', {
        html: templateHtmlCompiled.htmlString,
        cssList: [
          templateHtmlHeader.cssPrint,
          templateHtmlWrapper.cssPrint,
          templateHtmlFooter.cssPrint,
        ],
      })
    } catch (error) {
      console.log('🚀 ~ template-html.action.ts:247 ~ startPrintResultTicketLaboratory:', error)
    }
  }

  static async startPrintTicketClinicRadiologyResult(options: {
    ticket: Ticket
    customer: Customer
    ticketRadiologyData: TicketRadiology
  }) {
    const { ticketRadiologyData } = options
    const { organization, user } = MeService
    try {
      let templateHtmlId = ticketRadiologyData.templateHtmlId
      const templateHtmlHeader = await TemplateHtmlAction.getTemplateHtmlByType({
        templateHtmlType: TemplateHtmlType._HEADER,
        oid: organization.value.id,
      })
      const templateHtmlFooter = await TemplateHtmlAction.getTemplateHtmlByType({
        oid: organization.value.id,
        templateHtmlType: TemplateHtmlType._FOOTER,
      })
      const templateHtmlWrapper = await TemplateHtmlAction.getTemplateHtmlByType({
        oid: organization.value.id,
        templateHtmlType: TemplateHtmlType.TicketClinicRadiologyResult,
        templateHtmlId: templateHtmlId,
      })

      if (!templateHtmlHeader || !templateHtmlWrapper || !templateHtmlWrapper.htmlPrint) {
        return AlertStore.addError('Cài đặt in thất bại')
      }

      const templateHtmlCompiled = TemplateHtmlCompile.compilePageHtml({
        data: {
          organization: organization.value,
          me: user.value!,
          ticket: options.ticket,
          customer: options.customer,
          ticketRadiology: ticketRadiologyData,
        },
        template: {
          _header: templateHtmlHeader.htmlPrint,
          _footer: templateHtmlFooter.htmlPrint,
          _wrapper: templateHtmlWrapper.htmlPrint,
          _content: ticketRadiologyData.description || '',
        },
        variablesString: [
          templateHtmlHeader.initVariable,
          templateHtmlFooter.initVariable,
          templateHtmlWrapper.initVariable,
          ticketRadiologyData.customVariables,
        ],
      })

      if (!templateHtmlCompiled?.htmlString) {
        AlertStore.addError('Mẫu in không hợp lệ')
        return
      }

      await ESDom.startPrint('iframe-print', {
        html: templateHtmlCompiled?.htmlString || '',
        cssList: [
          templateHtmlHeader.cssPrint,
          templateHtmlFooter.cssPrint,
          templateHtmlWrapper.cssPrint,
          ticketRadiologyData.customStyles,
        ],
      })
    } catch (error) {
      console.log('🚀 ~ template-html.action.ts:406 ~ TemplateHtmlAction ~ error:', error)
    }
  }

  static async startPrintTicketClinicAllMoney(data: { ticket: Ticket; customer: Customer }) {
    await TemplateHtmlAction.startPrintCommon({
      data,
      templateHtmlType: TemplateHtmlType.TicketClinicAllMoney,
    })
  }

  static async startPrintTicketClinicCustomerPayment(data: { customer: Customer; payment: Payment }) {
    await TemplateHtmlAction.startPrintCommon({
      data,
      templateHtmlType: TemplateHtmlType.TicketClinicCustomerPayment,
    })
  }

  static async startPrintTicketClinicCustomerRefund(data: { customer: Customer; payment: Payment }) {
    await TemplateHtmlAction.startPrintCommon({
      data,
      templateHtmlType: TemplateHtmlType.TicketClinicCustomerRefund,
    })
  }
}
