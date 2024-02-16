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
  <div class="mt-4 w-full">
    <table v-if="isMobile" class="table-mobile">
      <thead>
        <tr>
          <th>Hóa đơn</th>
          <th>Tiền</th>
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
              {{ timeToText(distributorPayment.time, 'hh:mm DD/MM/YYYY') }}
            </div>
            <div>
              <DistributorPaymentTypeTag :type="distributorPayment.type" />
            </div>
            <div v-if="distributorPayment.note" style="font-size: 0.8rem">
              {{ distributorPayment.note }}
            </div>
            <div v-if="distributorPayment.description" style="font-size: 0.8rem">
              {{ distributorPayment.description }}
            </div>
          </td>
          <td class="text-right">
            <div class="flex justify-between item-center" style="white-space: nowrap">
              <span style="font-size: 0.8rem"> TT: </span>
              <span>{{ formatMoney(distributorPayment.paid) }}</span>
            </div>
            <div v-if="distributorPayment.debit != 0" style="white-space: nowrap">
              <div class="flex justify-between item-center">
                <div style="font-size: 0.8rem">
                  <span v-if="distributorPayment.type === PaymentType.ImmediatePayment"
                    >Ghi nợ:</span
                  >
                  <span v-if="distributorPayment.type === PaymentType.ReceiveRefund">Hoàn nợ:</span>
                  <span v-if="distributorPayment.type === PaymentType.PayDebt">Trừ nợ:</span>
                </div>
                <span>{{ formatMoney(distributorPayment.debit) }}</span>
              </div>
              <div class="flex justify-between item-center">
                <span style="font-size: 0.8rem"> Nợ cuối kỳ: </span>
                <span>{{ formatMoney(distributorPayment.distributorCloseDebt) }}</span>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <table v-else class="table-mobile">
      <thead>
        <tr>
          <th>Hóa đơn</th>
          <th>Loại</th>
          <th>Thanh toán</th>
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
              {{ timeToText(distributorPayment.time, 'hh:mm DD/MM/YYYY') }}
            </div>

            <div v-if="distributorPayment.note" style="font-size: 0.8rem">
              {{ distributorPayment.note }}
            </div>
          </td>
          <td class="px-4">
            <DistributorPaymentTypeTag :type="distributorPayment.type" />
            <div v-if="distributorPayment.description" style="font-size: 0.8rem">
              {{ distributorPayment.description }}
            </div>
          </td>
          <td style="white-space: nowrap; text-align: right">
            {{ formatMoney(distributorPayment.paid) }}
          </td>
          <td class="text-right">
            <div v-if="distributorPayment.debit != 0" style="white-space: nowrap">
              <div class="flex justify-between">
                <div style="font-size: 0.8rem">
                  <span v-if="distributorPayment.type === PaymentType.ImmediatePayment"
                    >Ghi nợ:</span
                  >
                  <span v-if="distributorPayment.type === PaymentType.ReceiveRefund">Hoàn nợ:</span>
                  <span v-if="distributorPayment.type === PaymentType.PayDebt">Trừ nợ:</span>
                </div>
                <span>{{ formatMoney(distributorPayment.debit) }}</span>
              </div>
              <div class="flex justify-between">
                <span style="font-size: 0.8rem"> Nợ cuối kỳ: </span>
                <span>{{ formatMoney(distributorPayment.distributorCloseDebt) }}</span>
              </div>
            </div>
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
