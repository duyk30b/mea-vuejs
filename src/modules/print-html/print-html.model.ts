export class PrintHtml {
  id: number
  name: string
  content: string // Dạng HTML
  initVariable: string // Dạng JS
  dataExample: string // Dạng JS
  updatedAt: number

  static init(): PrintHtml {
    const ins = new PrintHtml()
    ins.id = 0
    ins.name = ''
    ins.content = ''
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
    if (a.name != b.name) return false
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
