<script setup lang="ts">
import VuePagination from '@/common/VuePagination.vue'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { PaymentApi } from '@/modules/payment/payment.api'
import type { Payment } from '@/modules/payment/payment.model'
import { PaymentActionTypeText, PaymentPersonType } from '@/modules/payment/payment.type'
import { WalletService } from '@/modules/wallet'
import { ESTimer } from '@/utils'
import { BugDevelopment } from '@/views/component'
import PurchaseOrderLink from '@/views/purchase-order/PurchaseOrderLink.vue'
import PurchaseOrderStatusTag from '@/views/purchase-order/PurchaseOrderStatusTag.vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = withDefaults(defineProps<{ distributorId: number }>(), {
  distributorId: 0,
})

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

const paymentList = ref<Payment[]>([])
const walletMap = WalletService.walletMap

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const paginationResponse = await PaymentApi.pagination({
      relation: {
        distributor: false,
        wallet: false,
        paymentPurchaseOrderList: { purchaseOrder: true },
      },
      page: page.value,
      limit: limit.value,
      filter: {
        personType: PaymentPersonType.Distributor,
        personId: props.distributorId,
      },
      sort: { id: 'DESC' },
    })
    paymentList.value = paginationResponse.paymentList
    total.value = paginationResponse.total
  } catch (error) {}
}

watch(
  () => props.distributorId,
  async (newValue) => {
    if (newValue) await startFetchData()
    else paymentList.value = []
  },
  { immediate: true },
)

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
  }
  await startFetchData()
}

defineExpose({ startFetchData })
</script>

<template>
  <div class="mt-4 w-full table-wrapper">
    <table v-if="isMobile">
      <thead>
        <tr>
          <th>Phiếu nhập</th>
          <th>Tiền</th>
        </tr>
      </thead>
      <tbody style="">
        <tr v-if="paymentList.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="(payment, index) in paymentList" :key="index">
          <td>
            <div style="white-space: nowrap">
              {{ ESTimer.timeToText(payment.createdAt, 'hh:mm DD/MM/YYYY') }}
            </div>
            <div
              v-for="(paymentPurchaseOrder, index) in payment.paymentPurchaseOrderList"
              :key="index"
              class="flex gap-1 flex-wrap"
            >
              <PurchaseOrderLink
                :purchaseOrder="paymentPurchaseOrder.purchaseOrder!"
                :purchaseOrderId="paymentPurchaseOrder.purchaseOrderId"
              />
              <PurchaseOrderStatusTag :purchaseOrder="paymentPurchaseOrder.purchaseOrder!" />
            </div>
            <div v-if="payment.note">{{ payment.note }}</div>
          </td>
          <td class="text-right">
            <div class="flex justify-between item-center">
              <span>T.Toán:</span>
              <span>{{ formatMoney(payment.paidTotal) }}</span>
            </div>
            <div class="flex justify-between item-center">
              <span>Ghi nợ:</span>
              <span>{{ formatMoney(payment.debtTotal) }}</span>
            </div>
            <div class="flex justify-between item-center">
              <span>Nợ:</span>
              <span>
                {{ formatMoney(payment.personOpenDebt) }} ➞
                {{ formatMoney(payment.personCloseDebt) }}
              </span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <table v-if="!isMobile">
      <thead>
        <tr>
          <th v-if="CONFIG.MODE === 'development'"></th>
          <th>Thời gian</th>
          <th>Phiếu nhập</th>
          <th>Ví Thanh Toán</th>
          <th>Note</th>
          <th>Số tiền</th>
          <th>Ghi nợ</th>
          <th>Công nợ</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="paymentList.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="payment in paymentList" :key="payment.id">
          <td v-if="CONFIG.MODE === 'development'" style="text-align: center">
            <BugDevelopment :data="payment" />
          </td>
          <td class="text-center">
            <div style="white-space: nowrap">
              {{ ESTimer.timeToText(payment.createdAt, 'hh:mm DD/MM/YYYY') }}
            </div>
          </td>
          <td>
            <div
              v-for="(paymentPurchaseOrder, index) in payment.paymentPurchaseOrderList"
              :key="index"
              class="flex gap-1 flex-wrap"
            >
              <PurchaseOrderLink
                :purchaseOrder="paymentPurchaseOrder.purchaseOrder!"
                :purchaseOrderId="paymentPurchaseOrder.purchaseOrderId"
              />
              <PurchaseOrderStatusTag :purchaseOrder="paymentPurchaseOrder.purchaseOrder!" />
            </div>
          </td>
          <td class="text-left">
            {{ walletMap[payment.walletId]?.name }}
          </td>
          <td>
            <div>{{ PaymentActionTypeText[payment.paymentActionType] }}</div>
            <div v-if="payment.note" style="font-size: 0.9em">
              {{ payment.note }}
            </div>
          </td>
          <td style="white-space: nowrap; text-align: right">
            {{ formatMoney(-payment.paidTotal) }}
          </td>
          <td style="white-space: nowrap; text-align: right">
            {{ formatMoney(payment.debtTotal) }}
          </td>
          <td class="text-center">
            {{ formatMoney(payment.personOpenDebt) }} ➞
            {{ formatMoney(payment.personCloseDebt) }}
          </td>
        </tr>
      </tbody>
    </table>
    <div class="p-4 flex flex-wrap justify-end gap-4">
      <VuePagination
        class="ml-auto"
        v-model:page="page"
        :total="total"
        :limit="limit"
        @update:page="(p: any) => changePagination({ page: p, limit })"
      />
    </div>
  </div>
</template>
