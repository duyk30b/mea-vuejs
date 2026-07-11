export class Attribute {
  key: string
  description: string
  valueExample: string

  static init() {
    const ins = new Attribute()
    ins.key = ''
    ins.description = ''
    ins.valueExample = ''

    return ins
  }

  static blank() {
    const ins = Attribute.init()
    return ins
  }

  static basic(source?: Attribute) {
    const target = new Attribute()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Attribute[]): Attribute[] {
    return sources.map((i) => Attribute.basic(i))
  }

  static from(source?: Attribute) {
    const target = Attribute.basic(source)

    return target
  }

  static fromList(sourceList: Attribute[]): Attribute[] {
    return sourceList.map((i) => Attribute.from(i))
  }

  static equal(a: Attribute, b: Attribute) {
    if (a.key != b.key) return false
    if (a.description != b.description) return false
    if (a.valueExample != b.valueExample) return false

    return true
  }
}
