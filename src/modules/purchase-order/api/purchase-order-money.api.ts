import { AxiosInstance } from '../../../core/axios.instance'
import type { FullResponse } from '../../_base/base-dto'
import { Distributor } from '../../distributor'
import { Payment, PaymentActionType } from '../../payment'
import { PurchaseOrder } from '../purchase-order.model'

export class PurchaseOrderMoneyApi {
  static async paymentMoney(object: {
    purchaseOrderId: string
    body: {
      walletId: string
      paidTotal: number
      debtTotal: number
      paymentActionType: PaymentActionType
      note: string
    }
  }) {
    const { purchaseOrderId, body } = object
    const response = await AxiosInstance.post(
      `/purchase-order/${purchaseOrderId}/payment-money`,
      body,
    )
    const { data } = response.data as FullResponse<{
      purchaseOrderModified: any
      distributorModified?: any
      paymentCreated?: any
    }>

    return {
      distributorModified: data.distributorModified
        ? Distributor.from(data.distributorModified)
        : undefined,
      purchaseOrderModified: PurchaseOrder.from(data.purchaseOrderModified),
      paymentCreated: data.paymentCreated ? Payment.from(data.paymentCreated) : undefined,
    }
  }

  static async payDebt(body: {
    distributorId: number
    walletId: string
    totalMoney: number
    note: string
    dataList: { purchaseOrderId: string; debtTotalMinus: number }[]
  }) {
    const response = await AxiosInstance.post('/purchase-order/pay-debt', body)
    const { data } = response.data as FullResponse<
      {
        purchaseOrderModified: PurchaseOrder
        distributorModified: Distributor
        paymentCreated: Payment
      }[]
    >

    return data.map((i) => {
      return {
        distributorModified: i.distributorModified
          ? Distributor.from(i.distributorModified)
          : undefined,
        purchaseOrderModified: PurchaseOrder.from(i.purchaseOrderModified),
        paymentCreated: i.paymentCreated ? Payment.from(i.paymentCreated) : undefined,
      }
    })
  }
}
