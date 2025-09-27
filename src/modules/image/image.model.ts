export enum ImageHostType {
  GoogleDriver = 'GoogleDriver',
  Cloudinary = 'Cloudinary',
}

export enum ImageInteractType {
  Organization = 1,
  User = 2,
  Customer = 3,
}

export class Image {
  id: number
  imageInteractType: ImageInteractType // Loại hình ảnh
  imageInteractId: number // customerId, UserId, OrganizationId
  ticketId: string
  ticketItemId: string
  name: string
  mimeType: string
  hostType: ImageHostType
  hostAccount: string
  externalId: string
  externalUrl: string
  waitDelete: 0 | 1

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

  static from(source: Image) {
    const target = Image.basic(source)
    return target
  }

  static fromList(roots: Image[]) {
    return roots.map((i) => Image.from(i))
  }
}
