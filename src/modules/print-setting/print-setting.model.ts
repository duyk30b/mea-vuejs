import type { TemplateHtmlType } from '../template-html'

export class PrintSetting {
  oid: number
  id: number
  templateHtmlType: TemplateHtmlType
  templateHtmlId: number

  static init(): PrintSetting {
    const ins = new PrintSetting()
    ins.id = 0
    ins.templateHtmlType = 0 as any
    ins.templateHtmlId = 0

    return ins
  }

  static blank(): PrintSetting {
    const ins = PrintSetting.init()
    return ins
  }

  static basic(source: PrintSetting) {
    const target = new PrintSetting()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: PrintSetting[]): PrintSetting[] {
    return sources.map((i) => PrintSetting.basic(i))
  }

  static from(source: PrintSetting) {
    const target = PrintSetting.basic(source)
    return target
  }

  static fromList(sourceList: PrintSetting[]) {
    return sourceList.map((i) => PrintSetting.from(i))
  }

  static equal(a: PrintSetting, b: PrintSetting) {
    if (a.id != b.id) return false
    if (a.templateHtmlId != b.templateHtmlId) return false
    if (a.templateHtmlType != b.templateHtmlType) return false

    return true
  }

  static equalList(a: PrintSetting[], b: PrintSetting[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!PrintSetting.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
