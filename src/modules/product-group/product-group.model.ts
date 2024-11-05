export class ProductGroup {
  id: number
  name: string

  updatedAt: number

  static init(): ProductGroup {
    const ins = new ProductGroup()
    ins.id = 0

    return ins
  }

  static blank(): ProductGroup {
    const ins = ProductGroup.init()
    return ins
  }

  static basic(source: ProductGroup) {
    const target = new ProductGroup()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: ProductGroup[]): ProductGroup[] {
    return sources.map((i) => ProductGroup.basic(i))
  }

  static from(source: ProductGroup) {
    const target = ProductGroup.basic(source)
    return target
  }

  static fromList(sourceList: ProductGroup[]) {
    return sourceList.map((i) => ProductGroup.from(i))
  }
}
