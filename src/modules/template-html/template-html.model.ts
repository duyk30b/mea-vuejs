export enum TemplateHtmlType {
  _HEADER = 1,
  _FOOTER = 2,
  _HEADER_PREVIEW = 3,
  _FOOTER_PREVIEW = 4,
  PurchaseOrderDetail = 10,
  TicketOrderDetail = 20,
  TicketClinicDiagnosis = 30,
  TicketClinicDocumentExtra = 41,
  TicketClinicConsumable = 51,
  TicketClinicPrescription = 52,
  TicketClinicProcedure = 60,
  TicketClinicParaClinicalRequest = 70,
  TicketClinicLaboratoryResult = 71,
  TicketClinicRadiologyResult = 72,
  TicketClinicAllMoney = 80,
  TicketClinicCustomerPayment = 81,
  TicketClinicCustomerRefund = 82,
}

export const TemplateHtmlTypeText = {
  [TemplateHtmlType._HEADER]: '_HEADER',
  [TemplateHtmlType._FOOTER]: '_FOOTER',
  [TemplateHtmlType._HEADER_PREVIEW]: '_HEADER_PREVIEW',
  [TemplateHtmlType._FOOTER_PREVIEW]: '_FOOTER_PREVIEW',
  [TemplateHtmlType.PurchaseOrderDetail]: 'Phiếu nhập hàng chi tiết',
  [TemplateHtmlType.TicketOrderDetail]: 'Phiếu bán hàng chi tiết',
  [TemplateHtmlType.TicketClinicDiagnosis]: 'Phiếu khám',
  [TemplateHtmlType.TicketClinicDocumentExtra]: 'Phiếu tài liệu bổ sung',
  [TemplateHtmlType.TicketClinicConsumable]: 'Phiếu vật tư',
  [TemplateHtmlType.TicketClinicPrescription]: 'Đơn thuốc',
  [TemplateHtmlType.TicketClinicProcedure]: 'Dịch vụ',
  [TemplateHtmlType.TicketClinicParaClinicalRequest]: 'Phiếu chỉ định cận lâm sàng',
  [TemplateHtmlType.TicketClinicLaboratoryResult]: 'Phiếu kết quả xét nghiệm',
  [TemplateHtmlType.TicketClinicRadiologyResult]: 'Phiếu kết quả CĐHA',
  [TemplateHtmlType.TicketClinicAllMoney]: 'Bảng kê chi phí',
  [TemplateHtmlType.TicketClinicCustomerPayment]: 'Phiếu thu tiền',
  [TemplateHtmlType.TicketClinicCustomerRefund]: 'Phiếu hoàn tiền',
}

export class TemplateHtml {
  oid: number
  id: number
  priority: number
  templateHtmlType: TemplateHtmlType
  name: string
  htmlPrint: string // Dạng HTML
  cssPrint: string // Dạng CSS
  htmlInput: string // Dạng HTML
  jsInput: string // Dạng JS
  initVariable: string // Dạng JS
  dataExample: string // Dạng JS (cách lấy data từ ticket. Không dùng khi cài đặt Radiology)
  updatedAt: number

  static init(): TemplateHtml {
    const ins = new TemplateHtml()
    ins.id = 0
    ins.priority = 1
    ins.templateHtmlType = 0 as any
    ins.name = ''
    ins.htmlPrint = ''
    ins.cssPrint = ''
    ins.htmlInput = ''
    ins.jsInput = ''
    ins.initVariable = ''
    ins.dataExample = '{}'
    return ins
  }

  static blank(): TemplateHtml {
    const ins = TemplateHtml.init()
    return ins
  }

  static basic(source: TemplateHtml) {
    const target = new TemplateHtml()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: TemplateHtml[]): TemplateHtml[] {
    return sources.map((i) => TemplateHtml.basic(i))
  }

  static from(source: TemplateHtml) {
    const target = TemplateHtml.basic(source)
    return target
  }

  static fromList(sourceList: TemplateHtml[]) {
    return sourceList.map((i) => TemplateHtml.from(i))
  }

  static equal(a: TemplateHtml, b: TemplateHtml) {
    if (a.id != b.id) return false
    if (a.priority != b.priority) return false
    if (a.templateHtmlType != b.templateHtmlType) return false
    if (a.name != b.name) return false
    if (a.htmlPrint != b.htmlPrint) return false
    if (a.cssPrint != b.cssPrint) return false
    if (a.htmlInput != b.htmlInput) return false
    if (a.jsInput != b.jsInput) return false
    if (a.initVariable != b.initVariable) return false
    if (a.dataExample != b.dataExample) return false
    if (a.updatedAt != b.updatedAt) return false
    return true
  }

  static equalList(a: TemplateHtml[], b: TemplateHtml[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!TemplateHtml.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
