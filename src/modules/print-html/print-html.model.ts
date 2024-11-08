import { Radiology } from '../radiology'

export const PrintHtmlType = {
  DIAGNOSIS: 'Phiếu khám và chẩn đoán',
  PRESCRIPTION: 'Đơn thuốc',
  INVOICE: 'Hóa đơn',
  RADIOLOGY: 'Phiếu chẩn đoán hình ảnh',
}

export const PrintHtmlTypeList = Object.values(PrintHtmlType)

export class PrintHtml {
  id: number
  key: keyof typeof PrintHtmlType
  radiologyId: number
  content: string // Dạng HTML
  updatedAt: number

  radiology?: Radiology

  static init(): PrintHtml {
    const ins = new PrintHtml()
    ins.id = 0

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
    if (Object.prototype.hasOwnProperty.call(source, 'radiology')) {
      target.radiology = target.radiology ? Radiology.basic(target.radiology) : target.radiology
    }
    return target
  }

  static fromList(sourceList: PrintHtml[]) {
    return sourceList.map((i) => PrintHtml.from(i))
  }
}
