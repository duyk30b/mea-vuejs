export class SystemLog {
  oid: number
  uid: number
  clientId: string
  ip: string
  browser: string

  mobile: number
  apiMethod: string
  prefixController: string
  url: string
  statusCode: number

  timeMs: number
  request: string

  errorName: string
  errorMessage: string
  errorObject: object

  query: object
  body: object
  controller: {
    className?: string
    funcName?: string
    subject?: string
    topic?: string
    partition?: number
    offset?: string
  }

  createdAt: string

  static init(): SystemLog {
    const ins = new SystemLog()
    return ins
  }

  static blank(): SystemLog {
    const ins = SystemLog.init()
    return ins
  }

  static basic(source: SystemLog) {
    const target = new SystemLog()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: SystemLog[]): SystemLog[] {
    return sources.map((i) => SystemLog.basic(i))
  }

  static from(source: SystemLog) {
    const target = SystemLog.basic(source)
    return target
  }

  static fromList(sourceList: SystemLog[]) {
    return sourceList.map((i) => SystemLog.from(i))
  }
}
