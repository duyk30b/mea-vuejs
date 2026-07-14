export class CustomerGroup {
  id: string
  name: string

  updatedAt: number

  static init(): CustomerGroup {
    const ins = new CustomerGroup()
    ins.id = ''

    return ins
  }

  static blank(): CustomerGroup {
    const ins = CustomerGroup.init()
    return ins
  }

  static basic(source: CustomerGroup) {
    const target = new CustomerGroup()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: CustomerGroup[]): CustomerGroup[] {
    return sources.map((i) => CustomerGroup.basic(i))
  }

  static from(source: CustomerGroup) {
    const target = CustomerGroup.basic(source)
    return target
  }

  static fromList(sourceList: CustomerGroup[]) {
    return sourceList.map((i) => CustomerGroup.from(i))
  }
}
