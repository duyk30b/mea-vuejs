export default class Device {
  oid: number
  id: number
  refreshExp: number
  ip: string
  os: string
  browser: string
  mobile: 1 | 0
  online: boolean | number

  static basic(source: Device) {
    const target = new Device()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Device[]): Device[] {
    return sources.map((i) => Device.basic(i))
  }
}
