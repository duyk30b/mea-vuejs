export enum WalletType {
  Cash = 1,
  Bank = 2,
}

export const WalletTypeText = {
  [WalletType.Cash]: 'Tiền mặt',
  [WalletType.Bank]: 'Ví ngân hàng (chuyển khoản)',
}

export class Wallet {
  id: string
  code: string
  name: string
  money: number
  walletType: WalletType
  isActive: 0 | 1

  static init(): Wallet {
    const ins = new Wallet()
    ins.id = ''
    ins.code = ''
    ins.walletType = WalletType.Cash
    ins.isActive = 1

    return ins
  }

  static blank(): Wallet {
    const ins = Wallet.init()
    return ins
  }

  static basic(source: Wallet) {
    const target = new Wallet()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Wallet[]): Wallet[] {
    return sources.map((i) => Wallet.basic(i))
  }

  static from(source: Wallet) {
    const target = Wallet.basic(source)
    return target
  }

  static fromList(sourceList: Wallet[]) {
    return sourceList.map((i) => Wallet.from(i))
  }

  static equal(a: Wallet, b: Wallet) {
    if (a.id != b.id) return false
    if (a.code != b.code) return false
    if (a.name != b.name) return false
    if (a.money != b.money) return false
    if (a.walletType != b.walletType) return false

    if (a.isActive != b.isActive) return false
    return true
  }

  static equalList(a: Wallet[], b: Wallet[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!Wallet.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
