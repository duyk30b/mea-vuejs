export enum PrintHtmlType {
  _HEADER = 1,
  _FOOTER = 2,
  Prescription = 10,
  ProcedureRequest = 20,
  LaboratoryRequest = 30,
  LaboratoryResult = 31,
  Optometry = 32,
  RadiologyRequest = 40,
  RadiologyResult = 41,
  CustomerPayment = 50,
  Invoice = 60,
}

export const PrintHtmlTypeText = {
  [PrintHtmlType._HEADER]: '_HEADER',
  [PrintHtmlType._FOOTER]: '_FOOTER',
  [PrintHtmlType.Prescription]: 'Đơn thuốc',
  [PrintHtmlType.ProcedureRequest]: 'Phiếu chỉ định dịch vụ',
  [PrintHtmlType.LaboratoryRequest]: 'Phiếu chỉ định xét nghiệm',
  [PrintHtmlType.LaboratoryResult]: 'Phiếu kết quả xét nghiệm',
  [PrintHtmlType.Optometry]: 'Phiếu kết quả đo thị lực',
  [PrintHtmlType.RadiologyRequest]: 'Phiếu chỉ định CĐHA',
  [PrintHtmlType.RadiologyResult]: 'Phiếu kết quả CĐHA',
  [PrintHtmlType.CustomerPayment]: 'Phiếu thu tiền khách hàng',
  [PrintHtmlType.Invoice]: 'Hóa đơn',
}

export class PrintHtml {
  oid: number
  id: number
  priority: number
  printHtmlType: PrintHtmlType
  name: string
  html: string // Dạng HTML
  css: string // Dạng HTML
  initVariable: string // Dạng JS
  dataExample: string // Dạng JS (cách lấy data từ ticket. Không dùng khi cài đặt Radiology)
  updatedAt: number

  static init(): PrintHtml {
    const ins = new PrintHtml()
    ins.id = 0
    ins.priority = 1
    ins.printHtmlType = 0 as any
    ins.name = ''
    ins.html = ''
    ins.css = ''
    ins.initVariable = ''
    ins.dataExample = '{}'
    return ins
  }

  static blank(): PrintHtml {
    const ins = PrintHtml.init()
    return ins
  }

  static basic(source: PrintHtml) {
    const target = new PrintHtml()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: PrintHtml[]): PrintHtml[] {
    return sources.map((i) => PrintHtml.basic(i))
  }

  static from(source: PrintHtml) {
    const target = PrintHtml.basic(source)
    return target
  }

  static fromList(sourceList: PrintHtml[]) {
    return sourceList.map((i) => PrintHtml.from(i))
  }

  static equal(a: PrintHtml, b: PrintHtml) {
    if (a.id != b.id) return false
    if (a.priority != b.priority) return false
    if (a.printHtmlType != b.printHtmlType) return false
    if (a.name != b.name) return false
    if (a.html != b.html) return false
    if (a.css != b.css) return false
    if (a.initVariable != b.initVariable) return false
    if (a.dataExample != b.dataExample) return false
    if (a.updatedAt != b.updatedAt) return
    return true
  }

  static equalList(a: PrintHtml[], b: PrintHtml[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!PrintHtml.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
