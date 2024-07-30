export class ProcedureGroup {
  id: number
  name: string

  updatedAt: number

  static init(): ProcedureGroup {
    const ins = new ProcedureGroup()
    ins.id = 0

    return ins
  }

  static blank(): ProcedureGroup {
    const ins = ProcedureGroup.init()
    return ins
  }

  static basic(source: ProcedureGroup) {
    const target = new ProcedureGroup()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: ProcedureGroup[]): ProcedureGroup[] {
    return sources.map((i) => ProcedureGroup.basic(i))
  }

  static from(source: ProcedureGroup) {
    const target = ProcedureGroup.basic(source)
    return target
  }

  static fromList(sourceList: ProcedureGroup[]) {
    return sourceList.map((i) => ProcedureGroup.from(i))
  }
}
