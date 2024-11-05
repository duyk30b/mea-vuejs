export class Warehouse {
  id: number
  name: string
  updatedAt: number
  deletedAt: number

  static init(): Warehouse {
    const ins = new Warehouse()
    ins.id = 0
    return ins
  }

  static blank(): Warehouse {
    const ins = Warehouse.init()
    return ins
  }

  static basic(source: Warehouse) {
    const target = new Warehouse()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Warehouse[]): Warehouse[] {
    return sources.map((i) => Warehouse.basic(i))
  }

  static from(source: Warehouse) {
    const target = Warehouse.basic(source)
    return target
  }

  static fromList(sourceList: Warehouse[]) {
    return sourceList.map((i) => Warehouse.from(i))
  }
}
