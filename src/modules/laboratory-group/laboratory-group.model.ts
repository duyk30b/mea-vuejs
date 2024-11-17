export class LaboratoryGroup {
  id: number
  name: string

  static init(): LaboratoryGroup {
    const ins = new LaboratoryGroup()
    ins.id = 0

    return ins
  }

  static blank(): LaboratoryGroup {
    const ins = LaboratoryGroup.init()
    return ins
  }

  static basic(source: LaboratoryGroup) {
    const target = new LaboratoryGroup()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: LaboratoryGroup[]): LaboratoryGroup[] {
    return sources.map((i) => LaboratoryGroup.basic(i))
  }

  static from(source: LaboratoryGroup) {
    const target = LaboratoryGroup.basic(source)
    return target
  }

  static fromList(sourceList: LaboratoryGroup[]) {
    return sourceList.map((i) => LaboratoryGroup.from(i))
  }
}
