export class PaymentMethod {
  id: number
  priority: number
  name: string
  isActive: 0 | 1

  static init(): PaymentMethod {
    const ins = new PaymentMethod()
    ins.id = 0
    ins.priority = 1
    ins.isActive = 1

    return ins
  }

  static blank(): PaymentMethod {
    const ins = PaymentMethod.init()
    return ins
  }

  static basic(source: PaymentMethod) {
    const target = new PaymentMethod()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: PaymentMethod[]): PaymentMethod[] {
    return sources.map((i) => PaymentMethod.basic(i))
  }

  static from(source: PaymentMethod) {
    const target = PaymentMethod.basic(source)
    return target
  }

  static fromList(sourceList: PaymentMethod[]) {
    return sourceList.map((i) => PaymentMethod.from(i))
  }
}
