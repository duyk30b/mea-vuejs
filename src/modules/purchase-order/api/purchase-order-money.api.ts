import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import { Distributor } from '../../distributor'
import { Payment } from '../../payment'
import { PurchaseOrder } from '../purchase-order.model'

export class PurchaseOrderMoneyApi {
  static async prepaymentMoney(object: {
    purchaseOrderId: number
    body: {
      distributorId: number
      paymentMethodId: number
      paidAmount: number
      note: string
    }
  }) {
    const { purchaseOrderId, body } = object
    const response = await AxiosInstance.post(
      `/purchase-order/${purchaseOrderId}/prepayment-money`,
      body,
    )
    const { data } = response.data as BaseResponse<{
      distributor: any
      paymentCreated: any
      purchaseOrderModified: any
    }>

    const distributor = Distributor.from(data.distributor)
    const purchaseOrderModified = PurchaseOrder.from(data.purchaseOrderModified)
    const paymentCreated = Payment.from(data.paymentCreated)

    return { distributor, purchaseOrderModified, paymentCreated }
  }

  static async payDebt(body: {
    distributorId: number
    paymentMethodId: number
    paidAmount: number
    note: string
    dataList: { purchaseOrderId: number; paidAmount: number }[]
  }) {
    const response = await AxiosInstance.post('/purchase-order/pay-debt', body)
    const { data } = response.data as BaseResponse<{
      distributorModified: any
      paymentCreatedList: any[]
      purchaseOrderModifiedList: any[]
    }>

    const distributorModified = Distributor.from(data.distributorModified)
    const purchaseOrderModifiedList = PurchaseOrder.fromList(data.purchaseOrderModifiedList)
    const paymentCreatedList = Payment.fromList(data.paymentCreatedList)

    return { distributorModified, purchaseOrderModifiedList, paymentCreatedList }
  }

  static async refundMoney(object: {
    purchaseOrderId: number
    body: {
      distributorId: number
      paymentMethodId: number
      refundAmount: number
      note: string
    }
  }) {
    const { body, purchaseOrderId } = object
    const response = await AxiosInstance.post(
      `/purchase-order/${purchaseOrderId}/refund-money`,
      body,
    )
    const { data } = response.data as BaseResponse<{
      distributor: any
      paymentCreated: any
      purchaseOrderModified: any
    }>

    const distributor = Distributor.from(data.distributor)
    const purchaseOrderModified = PurchaseOrder.from(data.purchaseOrderModified)
    const paymentCreated = Payment.from(data.paymentCreated)

    return { distributor, purchaseOrderModified, paymentCreated }
  }
}
