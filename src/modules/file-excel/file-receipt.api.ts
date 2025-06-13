import { ProductDB } from '@/core/indexed-db/repository/product.repository'
import { AxiosInstance } from '../../core/axios.instance'
import { ESDom } from '../../utils'
import type { BaseResponse } from '../_base/base-dto'
import { Product } from '../product'
import { ReceiptItem } from '../receipt-item'

export class FileReceiptApi {
  static async downloadFileExampleReceiptItem() {
    const response = await AxiosInstance.get(
      `/file-receipt/download-excel/file-example-receipt-item`,
    )
    const { data } = response.data as BaseResponse<{
      buffer: { type: 'Buffer'; data: any[] }
      mimeType: string
      filename: string
    }>
    ESDom.downloadFile(data)
  }

  static async uploadExcelForGenerateReceiptItemList(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const response = await AxiosInstance.post(
      `/file-receipt/upload-excel/generate-receipt-item-list`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            console.log(`Đã upload: ${percentCompleted}%`)
          }
        },
      },
    )
    const { data } = response.data as BaseResponse<{
      receiptItemInsertList: any
      productCreatedList: any[]
      productModifiedList: any[]
    }>

    const productUpsertedList = Product.fromList([
      ...data.productCreatedList,
      ...data.productModifiedList,
    ])
    await ProductDB.upsertMany(productUpsertedList)
    return {
      receiptItemInsertList: ReceiptItem.fromList(data.receiptItemInsertList),
    }
  }
}
