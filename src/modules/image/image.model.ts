import { Expose } from 'class-transformer'
import { FROM_PLAIN } from '../_base/base-expose'

export enum ImageHost {
  GoogleDriver = 'GoogleDriver',
}

export class Image {
  @Expose({ groups: [FROM_PLAIN] })
  id: number

  @Expose()
  name: string

  @Expose()
  mimeType: string

  @Expose()
  hostType: ImageHost

  @Expose()
  hostAccount: string

  @Expose()
  hostId: string

  @Expose()
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
}
