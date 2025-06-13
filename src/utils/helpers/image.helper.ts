import { ImageHost } from '../../modules/image/image.model'

export class ESImage {
  static getImageLink = (
    data?: { hostId: string; hostType: ImageHost },
    options?: { size: number }
  ) => {
    if (!data || !options) return ''
    if (data.hostType === ImageHost.GoogleDriver) {
      return `https://drive.google.com/thumbnail?id=${data.hostId}&sz=w${options.size}`
    } else {
      return `https://drive.google.com/thumbnail?id=${data.hostId}&sz=w${options.size}`
    }
  }
}

// <iframe
//     src='https://drive.google.com/file/d/XXXXXXXXXX/preview'
//     width='100%'
//     height='100%'
//     allow='autoplay'
// ></iframe>
