export class Address {
  id: number
  province: string
  ward: string

  static init(): Address {
    const ins = new Address()
    ins.id = 0
    ins.province = ''
    ins.ward = ''

    return ins
  }

  static blank(): Address {
    const ins = Address.init()
    return ins
  }

  static basic(source: Address) {
    const target = new Address()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Address[]): Address[] {
    return sources.map((i) => Address.basic(i))
  }

  static from(source: Address) {
    const target = Address.basic(source)
    return target
  }

  static fromList(sourceList: Address[]) {
    return sourceList.map((i) => Address.from(i))
  }
}
