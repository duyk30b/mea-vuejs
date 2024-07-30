export class CustomerSource {
  id: number
  name: string

  static init(): CustomerSource {
    const ins = new CustomerSource()
    ins.id = 0

    return ins
  }

  static blank(): CustomerSource {
    const ins = CustomerSource.init()
    return ins
  }

  static basic(source: CustomerSource) {
    const target = new CustomerSource()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: CustomerSource[]): CustomerSource[] {
    return sources.map((i) => CustomerSource.basic(i))
  }

  static from(source: CustomerSource) {
    const target = CustomerSource.basic(source)
    return target
  }

  static fromList(sourceList: CustomerSource[]) {
    return sourceList.map((i) => CustomerSource.from(i))
  }
}
