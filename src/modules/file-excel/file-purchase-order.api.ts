import { ProductDB } from '@/core/indexed-db'
import { AxiosInstance } from '../../core/axios.instance'
import { ESDom } from '../../utils'
import type { FullResponse } from '../_base/base-dto'
import { Product } from '../product'
import { PurchaseOrderItem } from '../purchase-order-item'

export class FilePurchaseOrderApi {
  static async downloadFileExamplePurchaseOrderItem() {
    const response = await AxiosInstance.get(
      `/file-purchase-order/download-excel/file-example-purchase-order-item`,
    )
    const { data } = response.data as FullResponse<{
      buffer: { type: 'Buffer'; data: any[] }
      mimeType: string
      filename: string
    }>
    ESDom.downloadFile(data)
  }

  static async uploadExcelForGeneratePurchaseOrderItemList(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const response = await AxiosInstance.post(
      `/file-purchase-order/upload-excel/generate-purchase-order-item-list`,
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
    const { data } = response.data as FullResponse<{
      purchaseOrderItemInsertList: any
      productCreatedList: any[]
      productModifiedList: any[]
    }>

    const productUpsertedList = Product.fromList([
      ...data.productCreatedList,
      ...data.productModifiedList,
    ])
    await ProductDB.upsertMany(productUpsertedList)
    return {
      purchaseOrderItemInsertList: PurchaseOrderItem.fromList(data.purchaseOrderItemInsertList),
    }
  }
}
