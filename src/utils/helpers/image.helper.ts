import { ImageHost } from '../../modules/image/image.model'

export class DImage {
  static getImageLink = (options: { hostId: string; hostType: ImageHost; size: number }) => {
    const { hostId, hostType, size } = options
    if (hostType === ImageHost.GoogleDriver) {
      return `https://drive.google.com/thumbnail?id=${hostId}&amp;sz=w${size}`
    } else {
      return `https://drive.google.com/thumbnail?id=${hostId}&amp;sz=w${size}`
    }
  }
}
