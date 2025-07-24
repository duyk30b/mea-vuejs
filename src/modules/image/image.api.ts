import { ESTimer } from '@/utils'

export class ImageApi {
  static async uploadCloudinary(options: { file: File; oid: number; customerId: number }) {
    const { file, oid, customerId } = options
    const formData = new FormData()
    formData.append('file', file) // `file` là object File hoặc URL
    formData.append('upload_preset', 'meavn-preset') // hoặc dùng api_key + signature nếu có
    formData.append('folder', `mea-vn-${oid}`)
    formData.append(
      'public_id',
      `${oid}-${customerId}-${ESTimer.timeToText(new Date(), 'YY-MM-DD-hh-mm-ss-xxx')}`,
    )
    const resFetch = await fetch('https://api.cloudinary.com/v1_1/dwgvs7rax/image/upload', {
      method: 'POST',
      body: formData,
    })
    const data = await resFetch.json()
    return data.secure_url
  }
}
