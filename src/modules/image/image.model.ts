export enum ImageHost {
  GoogleDriver = 'GoogleDriver',
}

export class Image {
  id: number
  name: string
  mimeType: string
  hostType: ImageHost
  hostAccount: string
  hostId: string
  waitDelete: 0 | 1

  link(options: { size: number }) {
    const { size } = options
    if (this.hostType === ImageHost.GoogleDriver) {
      return `https://drive.google.com/thumbnail?id=${this.hostId}&amp;sz=w${size}`
    } else {
      return `https://drive.google.com/thumbnail?id=${this.hostId}&amp;sz=w${size}`
    }
  }

  static init(): Image {
    const ins = new Image()
    ins.id = 0
    return ins
  }

  static blank(): Image {
    const ins = Image.init()
    return ins
  }

  static basic(source: Image) {
    const target = new Image()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Image[]): Image[] {
    return sources.map((i) => Image.basic(i))
  }
}
