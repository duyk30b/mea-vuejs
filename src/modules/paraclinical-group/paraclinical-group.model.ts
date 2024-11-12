export class ParaclinicalGroup {
  id: number
  name: string

  updatedAt: number

  static init(): ParaclinicalGroup {
    const ins = new ParaclinicalGroup()
    ins.id = 0

    return ins
  }

  static blank(): ParaclinicalGroup {
    const ins = ParaclinicalGroup.init()
    return ins
  }

  static basic(source: ParaclinicalGroup) {
    const target = new ParaclinicalGroup()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: ParaclinicalGroup[]): ParaclinicalGroup[] {
    return sources.map((i) => ParaclinicalGroup.basic(i))
  }

  static from(source: ParaclinicalGroup) {
    const target = ParaclinicalGroup.basic(source)
    return target
  }

  static fromList(sourceList: ParaclinicalGroup[]) {
    return sourceList.map((i) => ParaclinicalGroup.from(i))
  }
}
