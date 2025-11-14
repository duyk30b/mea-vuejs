export enum WalletType {
  Debt = 1,
  Bank = 2,
  Cash = 3,
}

export const WalletTypeText = {
  [WalletType.Debt]: 'Ví nợ',
  [WalletType.Bank]: 'Ví ngân hàng (chuyển khoản)',
  [WalletType.Cash]: 'Tiền mặt',
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
    ins.isActive = 1
    ins.walletType = WalletType.Cash

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
}
