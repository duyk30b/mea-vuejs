<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMeStore } from '../../../modules/_me/me.store'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { Distributor } from '../../../modules/distributor'
import { DistributorPaymentApi } from '../../../modules/distributor-payment/distributor-payment.api'
import type { DistributorPayment } from '../../../modules/distributor-payment/distributor-payment.model'
import { PaymentType } from '../../../modules/enum'
import { timeToText } from '../../../utils'
import DistributorPaymentTypeTag from '../DistributorPaymentTypeTag.vue'

const props = withDefaults(defineProps<{ distributor: Distributor }>(), {
  distributor: () => Distributor.blank(),
})

const router = useRouter()

const screenStore = useScreenStore()
const { formatMoney, isMobile } = screenStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const distributorPaymentList = ref<DistributorPayment[]>([])
const page = ref(1)
const limit = ref(Number(localStorage.getItem('CUSTOMER_PAYMENTS_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const { data, meta } = await DistributorPaymentApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: { distributorId: props.distributor.id! },
      sort: { id: 'DESC' },
    })
    distributorPaymentList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: DistributorPaymentsHistory.vue:33 ~ error:', error)
  }
}

watch(
  () => props.distributor.id,
  async (newValue) => {
    if (newValue) await startFetchData()
    else distributorPaymentList.value = []
  },
  { immediate: true }
)

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('CUSTOMER_PAYMENTS_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

const openBlankReceiptDetail = async (receiptId: number) => {
  let route = router.resolve({
    name: 'ReceiptDetail',
    params: { id: receiptId },
  })
  window.open(route.href, '_blank')
}

defineExpose({ startFetchData })
</script>

<template>
  <div class="mt-4 w-full table-wrapper">
    <table v-if="isMobile">
      <thead>
        <tr>
          <th>Hóa đơn</th>
          <th>Tiền</th>
        </tr>
      </thead>
      <tbody style="font-size: 0.8rem">
        <tr v-if="distributorPaymentList.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="(distributorPayment, index) in distributorPaymentList" :key="index">
          <td>
            <div v-if="distributorPayment.receiptId">
              <a @click="openBlankReceiptDetail(distributorPayment.receiptId)">
                IV{{ distributorPayment.receiptId }}
              </a>
            </div>
            <div style="white-space: nowrap">
              {{ timeToText(distributorPayment.createdAt, 'hh:mm DD/MM/YYYY') }}
            </div>
            <div>
              <DistributorPaymentTypeTag :paymentType="distributorPayment.paymentType" />
            </div>
            <div v-if="distributorPayment.note">
              {{ distributorPayment.note }}
            </div>
            <div v-if="distributorPayment.description">
              {{ distributorPayment.description }}
            </div>
          </td>
          <td class="text-right">
            <div class="flex justify-between item-center">
              <span> T.Toán: </span>
              <span>{{ formatMoney(distributorPayment.paid) }}</span>
            </div>
            <div class="flex justify-between item-center">
              <span> Ghi nợ: </span>
              <span>{{ formatMoney(distributorPayment.debit) }}</span>
            </div>
            <div class="flex justify-between item-center">
              <span> Nợ: </span>
              <span>
                {{ formatMoney(distributorPayment.openDebt) }} ➞
                {{ formatMoney(distributorPayment.closeDebt) }}</span
              >
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <table v-if="!isMobile">
      <thead>
        <tr>
          <th>Hóa đơn</th>
          <th>Loại</th>
          <th>Thanh toán</th>
          <th>Ghi nợ</th>
          <th>Công nợ</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="distributorPaymentList.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="(distributorPayment, index) in distributorPaymentList" :key="index">
          <td>
            <div v-if="distributorPayment.receiptId">
              <a @click="openBlankReceiptDetail(distributorPayment.receiptId)">
                IV{{ distributorPayment.receiptId }}
              </a>
            </div>
            <div style="font-size: 0.8rem; white-space: nowrap">
              {{ timeToText(distributorPayment.createdAt, 'hh:mm DD/MM/YYYY') }}
            </div>
          </td>
          <td class="px-4">
            <DistributorPaymentTypeTag :paymentType="distributorPayment.paymentType" />
            <div v-if="distributorPayment.description" style="font-size: 0.8rem">
              {{ distributorPayment.description }}
            </div>
            <div v-if="distributorPayment.note" style="font-size: 0.8rem">
              {{ distributorPayment.note }}
            </div>
          </td>
          <td style="white-space: nowrap; text-align: right">
            {{ formatMoney(distributorPayment.paid) }}
          </td>
          <td style="white-space: nowrap; text-align: right">
            {{ formatMoney(distributorPayment.debit) }}
          </td>
          <td class="text-right">
            {{ formatMoney(distributorPayment.openDebt) }} ➞
            {{ formatMoney(distributorPayment.closeDebt) }}
          </td>
        </tr>
      </tbody>
    </table>
    <div class="mt-4 mb-2 flex justify-end">
      <a-pagination
        v-model:current="page"
        v-model:pageSize="limit"
        :total="total"
        show-size-changer
        @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })"
      />
    </div>
  </div>
</template>
