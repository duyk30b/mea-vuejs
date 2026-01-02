<script lang="ts" setup>
import IconBug from '@/common/icon-antd/IconBug.vue'
import { VueTooltip } from '@/common/popover'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Payment, PaymentActionTypeText, PaymentApi } from '@/modules/payment'
import { ref } from 'vue'
import VuePagination from '../../../../common/VuePagination.vue'
import { IconClose } from '../../../../common/icon-antd'
import { InputSelect, VueSwitch } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { ESTimer } from '../../../../utils'

const emit = defineEmits<{
  (e: 'select', payment: Payment): void
}>()

const showModal = ref(false)
const paymentList = ref<Payment[]>([])

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const page = ref(1)
const limit = ref(10)
const total = ref(0)

let firstLoad = true

const startFetchData = async () => {
  try {
    const paginationResult = await PaymentApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: {
        paymentTicketItemList: true,
        cashier: true,
        wallet: true,
        customer: true,
      },
      sort: { id: 'DESC' },
    })

    paymentList.value = paginationResult.paymentList
    total.value = paginationResult.total
  } catch (error) {
    console.log('🚀 ~ file: ModalSelectTicketExample.vue:37 ~ startFetchData ~ error:', error)
  }
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit
  startFetchData()
}

const openModal = async () => {
  showModal.value = true
  if (firstLoad) {
    startFetchData()
    firstLoad = false
  }
}

const closeModal = () => {
  showModal.value = false
}

const selectPaymentDemo = (payment: Payment) => {
  emit('select', payment)
  closeModal()
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 50px">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">Chọn phiếu thanh toán</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 modal-data-product-tabs">
        <div class="mt-4 table-wrapper">
          <table>
            <thead>
              <tr>
                <th v-if="CONFIG.MODE === 'development'"></th>
                <th>Thời gian</th>
                <th>Khách hàng</th>
                <th>Lý do</th>
                <th>Ví</th>
                <th>Số tiền</th>
                <th>Item</th>
                <th style="width: 100px">#</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paymentList.length === 0">
                <td colspan="20" class="text-center">Không có dữ liệu</td>
              </tr>
              <tr v-for="payment in paymentList" :key="payment.id">
                <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
                  <VueTooltip>
                    <template #trigger>
                      <IconBug width="1.2em" height="1.2em" />
                    </template>
                    <div style="max-height: 600px; max-width: 800px; overflow-y: scroll">
                      <pre>{{ JSON.stringify(payment, null, 4) }}</pre>
                    </div>
                  </VueTooltip>
                </td>
                <td class="text-center">
                  {{ ESTimer.timeToText(payment.createdAt, 'hh:mm DD/MM/YYYY') }}
                </td>
                <td>{{ payment.customer?.fullName }}</td>
                <td>{{ PaymentActionTypeText[payment.paymentActionType] }}</td>
                <td>{{ payment.wallet?.name }}</td>
                <td class="text-right">{{ formatMoney(payment.paidTotal) }}</td>
                <td>
                  <div class="flex justify-center items-center">
                    <VueSwitch :modelValue="payment.hasPaymentItem" disabled />
                  </div>
                </td>
                <td class="text-center">
                  <a @click="selectPaymentDemo(payment)">Chọn</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="p-4 flex flex-wrap justify-end gap-4">
          <VuePagination
            v-model:page="page"
            :total="total"
            :limit="limit"
            @update:page="(p: any) => changePagination({ page: p, limit })"
          />
          <InputSelect
            v-model:value="limit"
            @update:value="(l: any) => changePagination({ page, limit: l })"
            :options="[
              { value: 10, label: '10 / page' },
              { value: 20, label: '20 / page' },
              { value: 50, label: '50 / page' },
              { value: 100, label: '100 / page' },
            ]"
          />
        </div>
      </div>
    </div>
  </VueModal>
</template>

<style lang="scss" scoped></style>
