export class RadiologyGroup {
  id: number
  name: string

  updatedAt: number

  static init(): RadiologyGroup {
    const ins = new RadiologyGroup()
    ins.id = 0

    return ins
  }

  static blank(): RadiologyGroup {
    const ins = RadiologyGroup.init()
    return ins
  }

  static basic(source: RadiologyGroup) {
    const target = new RadiologyGroup()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: RadiologyGroup[]): RadiologyGroup[] {
    return sources.map((i) => RadiologyGroup.basic(i))
  }

  static from(source: RadiologyGroup) {
    const target = RadiologyGroup.basic(source)
    return target
  }

  static fromList(sourceList: RadiologyGroup[]) {
    return sourceList.map((i) => RadiologyGroup.from(i))
  }
}
