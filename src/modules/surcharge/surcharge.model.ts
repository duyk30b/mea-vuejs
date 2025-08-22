export class Surcharge {
  id: number
  code: string
  name: string
  isActive: 0 | 1

  static init(): Surcharge {
    const ins = new Surcharge()
    ins.id = 0
    ins.code = ''
    ins.isActive = 1

    return ins
  }

  static blank(): Surcharge {
    const ins = Surcharge.init()
    return ins
  }

  static basic(source: Surcharge) {
    const target = new Surcharge()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Surcharge[]): Surcharge[] {
    return sources.map((i) => Surcharge.basic(i))
  }

  static from(source: Surcharge) {
    const target = Surcharge.basic(source)
    return target
  }

  static fromList(sourceList: Surcharge[]) {
    return sourceList.map((i) => Surcharge.from(i))
  }
}
