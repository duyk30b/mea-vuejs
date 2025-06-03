<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import VuePagination from '../../../common/VuePagination.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { PaymentApi } from '../../../modules/payment/payment.api'
import { PersonType, type Payment } from '../../../modules/payment/payment.model'
import { ESTimer } from '../../../utils'
import PaymentTimingTag from '../../payment/PaymentTimingTag.vue'
import LinkAndStatusReceipt from '../../receipt/LinkAndStatusReceipt.vue'

const props = withDefaults(defineProps<{ distributorId: number }>(), {
  distributorId: 0,
})

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const paymentList = ref<Payment[]>([])
const page = ref(1)
const limit = ref(Number(localStorage.getItem('PAYMENT_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const paginationResponse = await PaymentApi.pagination({
      relation: { receipt: true, paymentMethod: true },
      page: page.value,
      limit: limit.value,
      filter: {
        personId: props.distributorId,
        personType: PersonType.Distributor,
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
    localStorage.setItem('PAYMENT_PAGINATION_LIMIT', String(options.limit))
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
      <tbody style="font-size: 0.8rem">
        <tr v-if="paymentList.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="(payment, index) in paymentList" :key="index">
          <td>
            <LinkAndStatusReceipt :receipt="payment.receipt!" />
            <div style="white-space: nowrap">
              {{ ESTimer.timeToText(payment.createdAt, 'hh:mm DD/MM/YYYY') }}
            </div>
            <div>
              <PaymentTimingTag :paymentTiming="payment.paymentTiming" />
            </div>
            <div v-if="payment.note">
              {{ payment.note }}
            </div>
            <div v-if="payment.description">
              {{ payment.description }}
            </div>
          </td>
          <td class="text-right">
            <div class="flex justify-between item-center">
              <span>T.Toán:</span>
              <span>{{ formatMoney(-payment.paidAmount) }}</span>
            </div>
            <div class="flex justify-between item-center">
              <span>Ghi nợ:</span>
              <span>{{ formatMoney(payment.debtAmount) }}</span>
            </div>
            <div class="flex justify-between item-center">
              <span>Nợ:</span>
              <span>
                {{ formatMoney(payment.openDebt) }} ➞
                {{ formatMoney(payment.closeDebt) }}
              </span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <table v-if="!isMobile">
      <thead>
        <tr>
          <th>Phiếu nhập</th>
          <th>Loại</th>
          <th>PTTT</th>
          <th>Số tiền</th>
          <th>Ghi nợ</th>
          <th>Công nợ</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="paymentList.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="(payment, index) in paymentList" :key="index">
          <td>
            <LinkAndStatusReceipt :receipt="payment.receipt!" :receiptId="payment.voucherId" />
            <div style="font-size: 0.8rem; white-space: nowrap">
              {{ ESTimer.timeToText(payment.createdAt, 'hh:mm DD/MM/YYYY') }}
            </div>
          </td>
          <td class="px-4">
            <PaymentTimingTag :paymentTiming="payment.paymentTiming" />
            <div v-if="payment.description" style="font-size: 0.8rem">
              {{ payment.description }}
            </div>
            <div v-if="payment.note" style="font-size: 0.8rem">
              {{ payment.note }}
            </div>
          </td>
          <td>{{ payment.paymentMethod?.name }}</td>
          <td style="white-space: nowrap; text-align: right">
            {{ formatMoney(-payment.paidAmount) }}
          </td>
          <td style="white-space: nowrap; text-align: right">
            {{ formatMoney(payment.debtAmount) }}
          </td>
          <td class="text-right">
            {{ formatMoney(payment.openDebt) }} ➞
            {{ formatMoney(payment.closeDebt) }}
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
