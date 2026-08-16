<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert'
import { InputMoney } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { PaymentViewType } from '@/modules/enum'
import { PaymentActionType } from '@/modules/payment/payment.type'
import { PermissionId } from '@/modules/permission/permission.enum'
import { PurchaseOrderActionApi, PurchaseOrderMoneyApi } from '@/modules/purchase-order'
import {
  PurchaseOrderActionType,
  PurchaseOrderActionTypeText,
} from '@/modules/purchase-order/purchase-order.type'
import { WalletService } from '@/modules/wallet'
import { purchaseOrderDetailRef } from '@/store/purchase-order.store'
import { ESTimer } from '@/utils'
import { BugDevelopment } from '@/views/component'
import InputSelectWallet from '@/views/component/InputSelectWallet.vue'
import { ref } from 'vue'

const inputMoneyPayment = ref<InstanceType<typeof InputMoney>>()

const emit = defineEmits<{ (e: 'success'): void }>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission, user } = MeService

const showModal = ref(false)
const paymentLoading = ref(false)
const paymentView = ref(PaymentViewType.Success)

const money = ref(0)
const walletId = ref<string>('')
const walletMap = WalletService.walletMap

const openModal = async (view = PaymentViewType.Success) => {
  paymentView.value = view
  money.value = 0
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  paymentView.value = PaymentViewType.Success
  money.value = 0
}

const handlePayment = async () => {
  paymentLoading.value = true
  try {
    if (paymentView.value === PaymentViewType.SendProductAndPaymentAndClose) {
      if (
        money.value < 0 ||
        money.value + purchaseOrderDetailRef.value.paid > purchaseOrderDetailRef.value.totalMoney
      ) {
        inputMoneyPayment.value?.focus()
        return AlertStore.addError('Số tiền thanh toán không hợp lệ')
      }
      const result = await PurchaseOrderActionApi.receiveProductAndPaymentAndClose(
        purchaseOrderDetailRef.value.id,
        {
          walletId: walletId.value,
          paidTotal: money.value,
          note: '',
        },
      )
      Object.assign(purchaseOrderDetailRef.value, result.purchaseOrderModified)
    }
    if (paymentView.value === PaymentViewType.Prepayment) {
      if (money.value <= 0) {
        return AlertStore.addError('Số tiền không hợp lệ')
      }
      const result = await PurchaseOrderMoneyApi.paymentMoney({
        purchaseOrderId: purchaseOrderDetailRef.value.id,
        body: {
          walletId: walletId.value,
          paidTotal: money.value,
          paymentActionType: PaymentActionType.PaymentMoney,
          purchaseOrderActionType: PurchaseOrderActionType.PrePayment,
          note: '',
        },
      })
      Object.assign(purchaseOrderDetailRef.value, result.purchaseOrderModified)
    }
    if (paymentView.value === PaymentViewType.PayDebt) {
      if (
        money.value <= 0 ||
        money.value + purchaseOrderDetailRef.value.paid > purchaseOrderDetailRef.value.totalMoney
      ) {
        inputMoneyPayment.value?.focus()
        return AlertStore.addError('Số tiền thanh toán không hợp lệ')
      }
      const payDebtResult = await PurchaseOrderMoneyApi.payDebt({
        distributorId: purchaseOrderDetailRef.value.distributorId,
        walletId: walletId.value,
        changeDebtList: [
          {
            paid: money.value,
            purchaseOrderId: purchaseOrderDetailRef.value.id,
            debt: -money.value,
          },
        ],
        note: '',
      })
      Object.assign(purchaseOrderDetailRef.value, payDebtResult.purchaseOrderModifiedList[0])
    }
    if (paymentView.value === PaymentViewType.RefundOverpaid) {
      if (
        money.value <= 0 ||
        purchaseOrderDetailRef.value.paid - money.value < purchaseOrderDetailRef.value.totalMoney
      ) {
        inputMoneyPayment.value?.focus()
        return AlertStore.addError('Số tiền thanh toán không hợp lệ')
      }
      const result = await PurchaseOrderMoneyApi.paymentMoney({
        purchaseOrderId: purchaseOrderDetailRef.value.id,
        body: {
          walletId: walletId.value,
          paidTotal: -money.value,
          paymentActionType: PaymentActionType.RefundMoney,
          purchaseOrderActionType: PurchaseOrderActionType.RefundMoney,
          note: '',
        },
      })
      Object.assign(purchaseOrderDetailRef.value, result.purchaseOrderModified)
    }

    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalPurchaseOrderPayment.vue:75 ~ handlePayment ~ error:', error)
  } finally {
    paymentLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" :style="'width: 800px'">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ purchaseOrderDetailRef.distributor?.fullName }} - Thanh toán
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <div class="text-right">
          <span class="mr-2">Tổng tiền đơn:</span>
          <span class="font-bold" style="font-size: 16px">
            {{ formatMoney(purchaseOrderDetailRef.totalMoney) }}
          </span>
        </div>
        <div class="mt-2 table-wrapper">
          <table>
            <thead>
              <tr>
                <th v-if="CONFIG.MODE === 'development'"></th>
                <th>#</th>
                <th>Thời gian</th>
                <th>Ví</th>
                <th>Note</th>
                <th>Tiền TT</th>
                <th>Ghi nợ</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(
                  paymentPurchaseOrder, index
                ) in purchaseOrderDetailRef.paymentPurchaseOrderList"
                :key="index"
              >
                <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
                  <BugDevelopment :data="paymentPurchaseOrder" />
                </td>
                <td class="text-center">{{ index + 1 }}</td>
                <td class="text-center" style="white-space: nowrap">
                  {{ ESTimer.timeToText(paymentPurchaseOrder.createdAt, 'DD/MM/YY hh:mm') }}
                </td>
                <td class="text-left">
                  <div>{{ walletMap[paymentPurchaseOrder.payment.walletId]?.name }}</div>
                </td>
                <td>
                  <div>
                    {{ PurchaseOrderActionTypeText[paymentPurchaseOrder.purchaseOrderActionType] }}
                  </div>
                  <div v-if="paymentPurchaseOrder.payment.note" style="font-size: 0.9em">
                    {{ paymentPurchaseOrder.payment.note }}
                  </div>
                </td>
                <td class="text-right" style="padding-right: 8px">
                  <div>{{ formatMoney(-paymentPurchaseOrder.paidMoney) }}</div>
                </td>
                <td class="text-right" style="padding-right: 8px">
                  <div>{{ formatMoney(paymentPurchaseOrder.debtMoney) }}</div>
                </td>
              </tr>
              <tr>
                <td v-if="CONFIG.MODE === 'development'"></td>
                <td colspan="4" class="text-right">Tổng đã thanh toán :</td>
                <td class="text-right font-bold">
                  {{ formatMoney(purchaseOrderDetailRef.paid) }}
                </td>
                <td></td>
              </tr>
              <tr v-if="purchaseOrderDetailRef.debt" style="color: var(--text-red)">
                <td v-if="CONFIG.MODE === 'development'"></td>
                <td colspan="4" class="text-right">Đang nợ :</td>
                <td></td>
                <td class="text-right font-bold">
                  {{ formatMoney(purchaseOrderDetailRef.debt) }}
                </td>
              </tr>
              <tr
                v-if="
                  purchaseOrderDetailRef.debt !=
                    purchaseOrderDetailRef.totalMoney - purchaseOrderDetailRef.paid &&
                  purchaseOrderDetailRef.totalMoney > purchaseOrderDetailRef.paid
                "
              >
                <td v-if="CONFIG.MODE === 'development'"></td>
                <td colspan="4" class="text-right">Đang thiếu :</td>
                <td class="text-right font-bold">
                  {{ formatMoney(purchaseOrderDetailRef.totalMoney - purchaseOrderDetailRef.paid) }}
                </td>
                <td></td>
              </tr>
              <tr
                v-if="purchaseOrderDetailRef.totalMoney < purchaseOrderDetailRef.paid"
                style="color: var(--text-green)"
              >
                <td v-if="CONFIG.MODE === 'development'"></td>
                <td colspan="4" class="text-right">Đang thừa</td>
                <td class="text-right font-bold">
                  {{ formatMoney(purchaseOrderDetailRef.paid - purchaseOrderDetailRef.totalMoney) }}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <form
        v-if="paymentView === PaymentViewType.RefundOverpaid"
        @submit.prevent="(e) => handlePayment()"
      >
        <div class="px-4">
          <table class="w-full mt-2">
            <tbody>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">PT Thanh toán :</td>
                <td>
                  <div class="pl-6">
                    <InputSelectWallet v-model:walletId="walletId" autoSelectFirstValue />
                  </div>
                </td>
              </tr>
              <tr>
                <td class="py-2"></td>
                <td></td>
              </tr>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap; width: 30%">
                  Số tiền hoàn trả :
                </td>
                <td>
                  <div class="flex items-stretch pl-6">
                    <VueButton
                      color="default"
                      type="button"
                      @click="
                        money = purchaseOrderDetailRef.paid - purchaseOrderDetailRef.totalMoney
                      "
                    >
                      Tất cả
                    </VueButton>
                    <div class="flex-1">
                      <InputMoney
                        ref="inputMoneyPayment"
                        v-model:value="money"
                        text-align="right"
                        :validate="{
                          gt: 0,
                          lte: purchaseOrderDetailRef.paid - purchaseOrderDetailRef.totalMoney,
                        }"
                      />
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td class="py-1"></td>
                <td></td>
              </tr>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">Còn thừa :</td>
                <td class="w-full font-bold text-right pr-3" style="font-size: 16px">
                  {{
                    formatMoney(
                      purchaseOrderDetailRef.paid - money - purchaseOrderDetailRef.totalMoney,
                    )
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 pb-6 flex justify-center gap-4">
          <VueButton
            v-if="userPermission[PermissionId.PURCHASE_ORDER_REFUND_MONEY]"
            type="submit"
            color="blue"
            icon="save"
            :loading="paymentLoading"
          >
            Hoàn trả
          </VueButton>
        </div>
      </form>

      <form
        v-else-if="paymentView !== PaymentViewType.Success"
        @submit.prevent="(e) => handlePayment()"
      >
        <div class="px-4">
          <table class="w-full mt-2">
            <tbody>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">PT Thanh toán :</td>
                <td>
                  <div class="pl-6">
                    <InputSelectWallet v-model:walletId="walletId" autoSelectFirstValue />
                  </div>
                </td>
              </tr>
              <tr>
                <td class="py-2"></td>
                <td></td>
              </tr>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap; width: 30%">
                  <span v-if="paymentView == PaymentViewType.Prepayment">Tạm ứng lần này :</span>
                  <span v-if="paymentView == PaymentViewType.SendProductAndPaymentAndClose">
                    Thanh toán lần này :
                  </span>
                  <span v-if="paymentView == PaymentViewType.PayDebt">Trả nợ :</span>
                </td>
                <td>
                  <div class="flex items-stretch pl-6">
                    <VueButton
                      color="default"
                      type="button"
                      @click="
                        money = purchaseOrderDetailRef.totalMoney - purchaseOrderDetailRef.paid
                      "
                    >
                      Tất cả
                    </VueButton>
                    <div class="flex-1">
                      <InputMoney
                        ref="inputMoneyPayment"
                        v-model:value="money"
                        text-align="right"
                        :validate="{ gte: 0 }"
                      />
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td class="py-1"></td>
                <td></td>
              </tr>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">
                  <span v-if="paymentView == PaymentViewType.PayDebt">Nợ còn :</span>
                  <span v-else>Còn thiếu :</span>
                </td>
                <td class="w-full font-bold text-right pr-3" style="font-size: 16px">
                  {{
                    formatMoney(
                      purchaseOrderDetailRef.totalMoney - (purchaseOrderDetailRef.paid + money),
                    )
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 pb-6 flex justify-center gap-4">
          <VueButton
            v-if="userPermission[PermissionId.PURCHASE_ORDER_PAYMENT_MONEY]"
            type="submit"
            color="blue"
            icon="save"
            :loading="paymentLoading"
          >
            <span v-if="paymentView == PaymentViewType.Prepayment">Tạm ứng</span>
            <template v-if="paymentView == PaymentViewType.SendProductAndPaymentAndClose">
              <span v-if="purchaseOrderDetailRef.totalMoney <= money">Nhập hàng và Thanh toán</span>
              <span v-else>Nhập hàng và ghi nợ</span>
            </template>
            <template v-if="paymentView == PaymentViewType.PayDebt">
              <span v-if="money < purchaseOrderDetailRef.debt">Trả nợ</span>
              <span v-else>Trả nợ và Kết thúc</span>
            </template>
          </VueButton>
        </div>
      </form>
      <div v-else class="pb-6 flex justify-center">
        <VueButton type="button" icon="close" @click="closeModal">Đóng lại</VueButton>
      </div>
    </div>
  </VueModal>
</template>
