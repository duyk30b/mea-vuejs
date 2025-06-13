export class ICD {
  id: number
  code: string
  name: string

  static init(): ICD {
    const ins = new ICD()
    ins.id = 0
    ins.code = ''
    ins.name = ''

    return ins
  }

  static blank(): ICD {
    const ins = ICD.init()
    return ins
  }

  static basic(source: ICD) {
    const target = new ICD()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: ICD[]): ICD[] {
    return sources.map((i) => ICD.basic(i))
  }

  static from(source: ICD) {
    const target = ICD.basic(source)
    return target
  }

  static fromList(sourceList: ICD[]) {
    return sourceList.map((i) => ICD.from(i))
  }
}
