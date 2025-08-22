export class Expense {
  id: number
  code: string
  name: string
  isActive: 0 | 1

  static init(): Expense {
    const ins = new Expense()
    ins.id = 0
    ins.code = ''
    ins.isActive = 1

    return ins
  }

  static blank(): Expense {
    const ins = Expense.init()
    return ins
  }

  static basic(source: Expense) {
    const target = new Expense()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Expense[]): Expense[] {
    return sources.map((i) => Expense.basic(i))
  }

  static from(source: Expense) {
    const target = Expense.basic(source)
    return target
  }

  static fromList(sourceList: Expense[]) {
    return sourceList.map((i) => Expense.from(i))
  }
}
