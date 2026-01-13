<script setup lang="ts">
import { IconBug } from '@/common/icon-antd'
import { VueTooltip } from '@/common/popover'
import VuePagination from '@/common/VuePagination.vue'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Payment, PaymentActionTypeText, PaymentApi, PaymentPersonType } from '@/modules/payment'
import { ESTimer } from '@/utils'
import LinkAndStatusPurchaseOrder from '@/views/purchase-order/LinkAndStatusPurchaseOrder.vue'
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
const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const paginationResponse = await PaymentApi.pagination({
      relation: { purchaseOrder: true, wallet: true },
      page: page.value,
      limit: limit.value,
      filter: {
        personId: props.distributorId,
        personType: PaymentPersonType.Distributor,
      },
      sort: { id: 'DESC' },
    })
    paymentList.value = paginationResponse.paymentList
    total.value = paginationResponse.total
  } catch (error) {
    console.log('🚀 ~ file: PaymentsHistory.vue:33 ~ error:', error)
  }
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
            <LinkAndStatusPurchaseOrder :purchaseOrder="payment.purchaseOrder!" :status="false" />
            <div style="white-space: nowrap">
              {{ ESTimer.timeToText(payment.createdAt, 'hh:mm DD/MM/YYYY') }}
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
          <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
            <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
              <template #trigger>
                <IconBug style="color: violet; cursor: pointer" width="1.2em" height="1.2em" />
              </template>
              <pre>{{ JSON.stringify(payment, null, 4) }}</pre>
            </VueTooltip>
          </td>
          <td>
            <LinkAndStatusPurchaseOrder
              :purchaseOrder="payment.purchaseOrder!"
              :purchaseOrderId="payment.voucherId"
              :status="false"
            />
            <div style="white-space: nowrap">
              {{ ESTimer.timeToText(payment.createdAt, 'hh:mm DD/MM/YYYY') }}
            </div>
          </td>
          <td class="text-center">
            <div>{{ payment.wallet?.name }}</div>
            <div>
              {{ formatMoney(payment.walletOpenMoney) }} ➞
              {{ formatMoney(payment.walletCloseMoney) }}
            </div>
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
