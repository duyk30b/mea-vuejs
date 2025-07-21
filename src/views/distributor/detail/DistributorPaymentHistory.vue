<script setup lang="ts">
import { PaymentPersonType } from '@/modules/payment'
import { PaymentItemApi, type PaymentItem } from '@/modules/payment-item'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import VuePagination from '../../../common/VuePagination.vue'
import { MeService } from '../../../modules/_me/me.service'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { ESTimer } from '../../../utils'
import LinkAndStatusReceipt from '../../receipt/LinkAndStatusReceipt.vue'
import { CONFIG } from '@/config'

const props = withDefaults(defineProps<{ distributorId: number }>(), {
  distributorId: 0,
})

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

const paymentItemList = ref<PaymentItem[]>([])
const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const paginationResponse = await PaymentItemApi.pagination({
      relation: { receipt: true },
      page: page.value,
      limit: limit.value,
      filter: {
        personId: props.distributorId,
        paymentPersonType: PaymentPersonType.Distributor,
      },
      sort: { id: 'DESC' },
    })
    paymentItemList.value = paginationResponse.paymentItemList
    total.value = paginationResponse.total
  } catch (error) {
    console.log('🚀 ~ file: PaymentsHistory.vue:33 ~ error:', error)
  }
}

watch(
  () => props.distributorId,
  async (newValue) => {
    if (newValue) await startFetchData()
    else paymentItemList.value = []
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
        <tr v-if="paymentItemList.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="(paymentItem, index) in paymentItemList" :key="index">
          <td>
            <LinkAndStatusReceipt :receipt="paymentItem.receipt!" :status="false" />
            <div style="white-space: nowrap">
              {{ ESTimer.timeToText(paymentItem.createdAt, 'hh:mm DD/MM/YYYY') }}
            </div>
            <div v-if="paymentItem.note">{{ paymentItem.note }}</div>
          </td>
          <td class="text-right">
            <div class="flex justify-between item-center">
              <span>T.Toán:</span>
              <span>{{ formatMoney(paymentItem.paidAmount) }}</span>
            </div>
            <div class="flex justify-between item-center">
              <span>Ghi nợ:</span>
              <span>{{ formatMoney(paymentItem.debtAmount) }}</span>
            </div>
            <div class="flex justify-between item-center">
              <span>Nợ:</span>
              <span>
                {{ formatMoney(paymentItem.openDebt) }} ➞
                {{ formatMoney(paymentItem.closeDebt) }}
              </span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <table v-if="!isMobile">
      <thead>
        <tr>
          <th v-if="CONFIG.MODE === 'development'">ID</th>
          <th>Phiếu nhập</th>
          <th>Note</th>
          <th>Số tiền</th>
          <th>Ghi nợ</th>
          <th>Công nợ</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="paymentItemList.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="paymentItem in paymentItemList" :key="paymentItem.id">
          <td v-if="CONFIG.MODE === 'development'" style="text-align: center; color: violet">
            {{ paymentItem.id }}
          </td>
          <td>
            <LinkAndStatusReceipt
              :receipt="paymentItem.receipt!"
              :receiptId="paymentItem.voucherId"
              :status="false"
            />
            <div style="white-space: nowrap">
              {{ ESTimer.timeToText(paymentItem.createdAt, 'hh:mm DD/MM/YYYY') }}
            </div>
          </td>
          <td class="px-4">
            <div v-if="paymentItem.note" style="">
              {{ paymentItem.note }}
            </div>
          </td>
          <td style="white-space: nowrap; text-align: right">
            {{ formatMoney(paymentItem.paidAmount) }}
          </td>
          <td style="white-space: nowrap; text-align: right">
            {{ formatMoney(paymentItem.debtAmount) }}
          </td>
          <td class="text-right">
            {{ formatMoney(paymentItem.openDebt) }} ➞
            {{ formatMoney(paymentItem.closeDebt) }}
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
