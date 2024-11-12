import { Paraclinical } from '../paraclinical'

export const PrintHtmlType = {
  DIAGNOSIS: 'Phiếu khám và chẩn đoán',
  OPTOMETRY: 'Phiếu đo thị lực',
  PRESCRIPTION: 'Đơn thuốc',
  INVOICE: 'Hóa đơn',
  PARACLINICAL: 'Phiếu cận lâm sàng',
}

export const PrintHtmlTypeList = Object.values(PrintHtmlType)

export class PrintHtml {
  id: number
  type: keyof typeof PrintHtmlType
  paraclinicalId: number
  content: string // Dạng HTML
  updatedAt: number

  paraclinical?: Paraclinical

  static init(): PrintHtml {
    const ins = new PrintHtml()
    ins.id = 0
    ins.paraclinicalId = 0
    ins.content = ''
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
    if (Object.prototype.hasOwnProperty.call(source, 'paraclinical')) {
      target.paraclinical = target.paraclinical
        ? Paraclinical.basic(target.paraclinical)
        : target.paraclinical
    }
    return target
  }

  static fromList(sourceList: PrintHtml[]) {
    return sourceList.map((i) => PrintHtml.from(i))
  }

  static equal(a: PrintHtml, b: PrintHtml) {
    if (a.id != b.id) return false
    if (a.type != b.type) return false
    if (a.paraclinicalId != b.paraclinicalId) return false
    if (a.content != b.content) return false
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
