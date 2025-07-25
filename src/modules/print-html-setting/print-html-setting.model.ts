import type { PrintHtmlType } from '../print-html/print-html.model'

export class PrintHtmlSetting {
  oid: number
  id: number
  printHtmlType: PrintHtmlType
  printHtmlId: number

  static init(): PrintHtmlSetting {
    const ins = new PrintHtmlSetting()
    ins.id = 0
    ins.printHtmlType = 0 as any
    ins.printHtmlId = 0

    return ins
  }

  static blank(): PrintHtmlSetting {
    const ins = PrintHtmlSetting.init()
    return ins
  }

  static basic(source: PrintHtmlSetting) {
    const target = new PrintHtmlSetting()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: PrintHtmlSetting[]): PrintHtmlSetting[] {
    return sources.map((i) => PrintHtmlSetting.basic(i))
  }

  static from(source: PrintHtmlSetting) {
    const target = PrintHtmlSetting.basic(source)
    return target
  }

  static fromList(sourceList: PrintHtmlSetting[]) {
    return sourceList.map((i) => PrintHtmlSetting.from(i))
  }

  static equal(a: PrintHtmlSetting, b: PrintHtmlSetting) {
    if (a.id != b.id) return false
    if (a.printHtmlId != b.printHtmlId) return false
    if (a.printHtmlType != b.printHtmlType) return false

    return true
  }

  static equalList(a: PrintHtmlSetting[], b: PrintHtmlSetting[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!PrintHtmlSetting.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
