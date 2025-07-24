import { Image, ImageHostType } from '../../modules/image/image.model'

export class ESImage {
  static getImageLink = (data?: Image, options?: { size: number }) => {
    if (!data || !options) return ''
    if (data.hostType === ImageHostType.GoogleDriver) {
      return `https://drive.google.com/thumbnail?id=${data.externalId}&sz=w${options.size}`
    }
    if (data.hostType === ImageHostType.Cloudinary) {
      return data.externalUrl
    } else {
      return `https://drive.google.com/thumbnail?id=${data.externalId}&sz=w${options.size}`
    }
  }
}

// <iframe
//     src='https://drive.google.com/file/d/XXXXXXXXXX/preview'
//     width='100%'
//     height='100%'
//     allow='autoplay'
// ></iframe>
