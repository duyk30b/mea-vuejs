export class OrganizationPayment {
  id: number
  oid: string
  money: number // tổng tiền thanh toán
  createdAt: number
  expiryAt: number
  note: string // Ghi chú

  static init(): OrganizationPayment {
    const ins = new OrganizationPayment()
    ins.id = 0
    ins.money = 0
    return ins
  }

  static blank() {
    const ins = OrganizationPayment.init()
    return ins
  }

  static basic(source: OrganizationPayment) {
    const target = new OrganizationPayment()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: OrganizationPayment[]): OrganizationPayment[] {
    return sources.map((i) => OrganizationPayment.basic(i))
  }

  static from(source: OrganizationPayment) {
    const target = OrganizationPayment.basic(source)
    return target
  }

  static fromList(sourceList: OrganizationPayment[]) {
    return sourceList.map((i) => OrganizationPayment.from(i))
  }

  static equal(a: OrganizationPayment, b: OrganizationPayment) {
    if (a.id != b.id) return false
    if (a.oid != b.oid) return false
    if (a.money != b.money) return false
    if (a.createdAt != b.createdAt) return false
    if (a.note != b.note) return false
    return true
  }
}
