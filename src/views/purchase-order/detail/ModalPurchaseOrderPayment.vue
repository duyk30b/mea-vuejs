<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconBug, IconClose } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert'
import { InputMoney, InputSelect } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { PaymentViewType } from '@/modules/enum'
import { PaymentActionType, PaymentActionTypeText, PaymentApi } from '@/modules/payment'
import { Wallet, WalletService } from '@/modules/wallet'
import { PermissionId } from '@/modules/permission/permission.enum'
import { ESArray, timeToText } from '@/utils'
import { onMounted, ref } from 'vue'
import { purchaseOrder } from './purchase-order-detail.ref'
import { PurchaseOrderActionApi, PurchaseOrderMoneyApi } from '@/modules/purchase-order'
import InputSelectWallet from '@/views/component/InputSelectWallet.vue'
import { VueTooltip } from '@/common/popover'

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
        money.value + purchaseOrder.value.paid > purchaseOrder.value.totalMoney
      ) {
        inputMoneyPayment.value?.focus()
        return AlertStore.addError('Số tiền thanh toán không hợp lệ')
      }
      const result = await PurchaseOrderActionApi.sendProductAndPaymentAndClose(
        purchaseOrder.value.id,
        {
          walletId: walletId.value,
          paidTotal: money.value,
          debtTotal: 0, // ghi nợ khi close, chưa cần ghi nợ ngay
          note: '',
        },
      )
      Object.assign(purchaseOrder.value, result.purchaseOrderModified)
      purchaseOrder.value.paymentList?.push(...result.paymentCreatedList)
    }
    if (paymentView.value === PaymentViewType.Prepayment) {
      if (money.value <= 0) {
        return AlertStore.addError('Số tiền không hợp lệ')
      }
      const result = await PurchaseOrderMoneyApi.paymentMoney({
        purchaseOrderId: purchaseOrder.value.id,
        body: {
          walletId: walletId.value,
          paidTotal: money.value,
          debtTotal: 0,
          paymentActionType: PaymentActionType.PaymentMoney,
          note: '',
        },
      })
      Object.assign(purchaseOrder.value, result.purchaseOrderModified)
      if (result.paymentCreated) {
        purchaseOrder.value.paymentList!.push(result.paymentCreated)
      }
    }
    if (paymentView.value === PaymentViewType.PayDebt) {
      if (
        money.value <= 0 ||
        money.value + purchaseOrder.value.paid > purchaseOrder.value.totalMoney
      ) {
        inputMoneyPayment.value?.focus()
        return AlertStore.addError('Số tiền thanh toán không hợp lệ')
      }
      const [result] = await PurchaseOrderMoneyApi.payDebt({
        distributorId: purchaseOrder.value.distributorId,
        walletId: walletId.value,
        totalMoney: money.value,
        dataList: [{ debtTotalMinus: money.value, purchaseOrderId: purchaseOrder.value.id }],
        note: '',
      })
      Object.assign(purchaseOrder.value, result.purchaseOrderModified)
      if (result.paymentCreated) {
        purchaseOrder.value.paymentList!.push(result.paymentCreated)
      }
    }
    if (paymentView.value === PaymentViewType.RefundOverpaid) {
      if (
        money.value <= 0 ||
        purchaseOrder.value.paid - money.value < purchaseOrder.value.totalMoney
      ) {
        inputMoneyPayment.value?.focus()
        return AlertStore.addError('Số tiền thanh toán không hợp lệ')
      }
      const result = await PurchaseOrderMoneyApi.paymentMoney({
        purchaseOrderId: purchaseOrder.value.id,
        body: {
          walletId: walletId.value,
          paidTotal: -money.value,
          debtTotal: 0,
          paymentActionType: PaymentActionType.RefundMoney,
          note: '',
        },
      })
      Object.assign(purchaseOrder.value, result.purchaseOrderModified)
      if (result.paymentCreated) {
        purchaseOrder.value.paymentList!.push(result.paymentCreated)
      }
    }

    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalDistributorUpsert.vue:75 ~ handlePayment ~ error:', error)
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
          {{ purchaseOrder.distributor?.fullName }} - Thanh toán
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <div class="text-right">
          <span class="mr-2">Tổng tiền đơn:</span>
          <span class="font-bold" style="font-size: 16px">
            {{ formatMoney(purchaseOrder.totalMoney) }}
          </span>
        </div>
        <div class="mt-2 table-wrapper">
          <table>
            <thead>
              <tr>
                <th v-if="CONFIG.MODE === 'development'">ID</th>
                <th>#</th>
                <th>Thời gian</th>
                <th>PT Thanh toán</th>
                <th>Note</th>
                <th>Tiền</th>
                <th v-if="CONFIG.MODE === 'development'">Ghi nợ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(payment, index) in purchaseOrder.paymentList" :key="index">
                <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
                  <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
                    <template #trigger>
                      <IconBug style="color: violet; cursor: pointer" width="1.2em" height="1.2em" />
                    </template>
                    <pre>{{ JSON.stringify(payment, null, 4) }}</pre>
                  </VueTooltip>
                </td>
                <td class="text-center">{{ index + 1 }}</td>
                <td class="text-left">
                  {{ timeToText(payment.createdAt, 'DD/MM/YY hh:mm') }}
                </td>
                <td class="text-left">
                  <div>{{ walletMap[payment.walletId]?.name }}</div>
                  <div v-if="CONFIG.MODE === 'development'" style="color: violet">
                    {{ formatMoney(payment.walletOpenMoney) }} ->
                    {{ formatMoney(payment.walletCloseMoney) }}
                  </div>
                </td>
                <td>
                  <div>{{ PaymentActionTypeText[payment.paymentActionType] }}</div>
                  <div v-if="payment.note" style="font-size: 0.9em">
                    {{ payment.note }}
                  </div>
                </td>
                <td class="text-right" style="padding-right: 8px">
                  <div>{{ formatMoney(-payment.paidTotal) }}</div>
                </td>
                <td class="text-right" v-if="CONFIG.MODE === 'development'" style="color: violet">
                  <div>{{ formatMoney(-payment.debtTotal) }}</div>
                  <div>
                    {{ formatMoney(payment.personOpenDebt) }} ->
                    {{ formatMoney(payment.personCloseDebt) }}
                  </div>
                </td>
              </tr>
              <tr>
                <td v-if="CONFIG.MODE === 'development'"></td>
                <td colspan="4" class="text-right">Tổng đã thanh toán :</td>
                <td class="text-right font-bold">{{ formatMoney(purchaseOrder.paid) }}</td>
                <td v-if="CONFIG.MODE === 'development'"></td>
              </tr>
              <tr v-if="purchaseOrder.debt" style="color: var(--text-red)">
                <td v-if="CONFIG.MODE === 'development'"></td>
                <td colspan="4" class="text-right">Đang nợ :</td>
                <td class="text-right font-bold">{{ formatMoney(purchaseOrder.debt) }}</td>
                <td v-if="CONFIG.MODE === 'development'"></td>
              </tr>
              <tr
                v-if="
                  purchaseOrder.debt != purchaseOrder.totalMoney - purchaseOrder.paid &&
                  purchaseOrder.totalMoney > purchaseOrder.paid
                "
              >
                <td v-if="CONFIG.MODE === 'development'"></td>
                <td colspan="4" class="text-right">Đang thiếu :</td>
                <td class="text-right font-bold">
                  {{ formatMoney(purchaseOrder.totalMoney - purchaseOrder.paid) }}
                </td>
                <td v-if="CONFIG.MODE === 'development'"></td>
              </tr>
              <tr
                v-if="purchaseOrder.totalMoney < purchaseOrder.paid"
                style="color: var(--text-green)"
              >
                <td v-if="CONFIG.MODE === 'development'"></td>
                <td colspan="4" class="text-right">Đang thừa</td>
                <td class="text-right font-bold">
                  {{ formatMoney(purchaseOrder.paid - purchaseOrder.totalMoney) }}
                </td>
                <td v-if="CONFIG.MODE === 'development'"></td>
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
                      @click="money = purchaseOrder.paid - purchaseOrder.totalMoney"
                    >
                      Tất cả
                    </VueButton>
                    <div class="flex-1">
                      <InputMoney
                        ref="inputMoneyPayment"
                        v-model:value="money"
                        text-align="right"
                        :validate="{ gt: 0, lte: purchaseOrder.paid - purchaseOrder.totalMoney }"
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
                  {{ formatMoney(purchaseOrder.paid - money - purchaseOrder.totalMoney) }}
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
                      @click="money = purchaseOrder.totalMoney - purchaseOrder.paid"
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
                  {{ formatMoney(purchaseOrder.totalMoney - (purchaseOrder.paid + money)) }}
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
              <span v-if="purchaseOrder.totalMoney <= money">Nhập hàng và Thanh toán</span>
              <span v-else>Nhập hàng và ghi nợ</span>
            </template>
            <template v-if="paymentView == PaymentViewType.PayDebt">
              <span v-if="money < purchaseOrder.debt">Trả nợ</span>
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
