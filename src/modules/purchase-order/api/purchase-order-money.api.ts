import { AxiosInstance } from '@/core/axios.instance'
import type { FullResponse } from '../../_base/base-dto'
import { Distributor } from '../../distributor'
import { PurchaseOrder } from '../purchase-order.model'
import type { PurchaseOrderActionType } from '../purchase-order.type'
import type { PaymentActionType } from '@/modules/payment/payment.type'

export class PurchaseOrderMoneyApi {
  static async paymentMoney(object: {
    purchaseOrderId: string
    body: {
      walletId: string
      paymentActionType: PaymentActionType
      purchaseOrderActionType: PurchaseOrderActionType
      paidTotal: number
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
    }>

    return {
      purchaseOrderModified: PurchaseOrder.from(data.purchaseOrderModified),
    }
  }

  static async payDebt(body: {
    distributorId: number
    walletId: string
    note: string
    changeDebtList: { purchaseOrderId: string; paid: number; debt: number }[]
  }) {
    const response = await AxiosInstance.post('/purchase-order/pay-debt', body)
    const { data } = response.data as FullResponse<{
      purchaseOrderModifiedList: any[]
      distributorModified: any
    }>

    return {
      purchaseOrderModifiedList: PurchaseOrder.fromList(data.purchaseOrderModifiedList || []),
      distributorModified: Distributor.from(data.distributorModified),
    }
  }
}
