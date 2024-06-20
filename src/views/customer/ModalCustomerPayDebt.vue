<script setup lang="ts">
import { CloseOutlined, SaveOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import VueModal from '../../common/VueModal.vue'
import { InputMoney, InputText } from '../../common/vue-form'
import { useScreenStore } from '../../modules/_me/screen.store'
import { useCustomerStore, type Customer } from '../../modules/customer'
import { CustomerPaymentApi } from '../../modules/customer-payment/customer-payment.api'
import type { Invoice } from '../../modules/invoice'
import type { Visit } from '../../modules/visit'
import { timeToText } from '../../utils'
import VueButton from '../../common/VueButton.vue'

const inputMoneyPay = ref<InstanceType<typeof InputMoney>>()

const emit = defineEmits<{
  (e: 'success', value: { customer: Customer }): void
}>()
const router = useRouter()

const customerStore = useCustomerStore()
const screenStore = useScreenStore()
const { formatMoney } = screenStore

const openDebt = ref(0)
const money = ref(0)
const note = ref('')
const customerId = ref(0)
const invoicePaymentList = ref<{ invoice: Invoice; money: number }[]>([])
const visitPaymentList = ref<{ visit: Visit; money: number }[]>([])

const showModal = ref(false)
const dataLoading = ref(false)
const saveLoading = ref(false)

const openModal = async (customerIdProp: number, openDebtProp: number) => {
  money.value = 0
  note.value = ''
  openDebt.value = openDebtProp
  customerId.value = customerIdProp
  showModal.value = true
  nextTick(() => inputMoneyPay.value?.focus())
  try {
    dataLoading.value = true
    const response = await CustomerPaymentApi.voucherDebtList(customerIdProp)
    invoicePaymentList.value = response.invoiceBasicList.map((i) => ({ invoice: i, money: 0 }))
    visitPaymentList.value = response.visitBasicList.map((i) => ({ visit: i, money: 0 }))
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerPayDebt.vue:56 ~ openModal ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

const closeModal = () => {
  showModal.value = false
  invoicePaymentList.value = []
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (money.value === 0) {
      return message.error('Số tiền trả nợ phải khác 0')
    }
    const data = await customerStore.payDebt({
      customerId: customerId.value,
      note: note.value,
      invoicePaymentList: invoicePaymentList.value
        .map((i) => ({ invoiceId: i.invoice.id, money: i.money }))
        .filter((i) => i.money > 0),
      visitPaymentList: visitPaymentList.value
        .map((i) => ({ visitId: i.visit.id, money: i.money }))
        .filter((i) => i.money > 0),
    })
    emit('success', data)
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:39 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const openBlankInvoiceDetail = (invoiceId: number) => {
  let route = router.resolve({
    name: 'InvoiceDetail',
    params: { id: invoiceId },
  })
  window.open(route.href, '_blank')
}

const openBlankVisitDetail = (visitId: number) => {
  let route = router.resolve({
    name: 'VisitDetail',
    params: { id: visitId },
  })
  window.open(route.href, '_blank')
}

const handleClickPayAllDebt = () => {
  money.value = openDebt.value
  calculatorEachVoucherPayment()
}

const calculatorEachVoucherPayment = () => {
  let totalMoney = money.value
  invoicePaymentList.value.forEach((item) => {
    let number = Math.min(totalMoney, item.invoice.debt)
    item.money = number
    totalMoney = totalMoney - number
  })
  visitPaymentList.value.forEach((item) => {
    let number = Math.min(totalMoney, item.visit.debt)
    item.money = number
    totalMoney = totalMoney - number
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <form class="bg-white" @submit.prevent="handleSave">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">
          {{ 'Trả nợ' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <CloseOutlined />
        </div>
      </div>

      <div class="p-4">
        <div class="">Tính tiền vào phiếu (tự động)</div>
        <div class="mt-2 table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Phiếu</th>
                <th>Nợ</th>
                <th>Số tiền trả</th>
              </tr>
            </thead>
            <tbody v-if="dataLoading">
              <tr>
                <td colspan="100">
                  <div class="vue-skeleton-loading"></div>
                  <div class="vue-skeleton-loading mt-2"></div>
                </td>
              </tr>
              <tr>
                <td colspan="100">
                  <div class="vue-skeleton-loading"></div>
                  <div class="vue-skeleton-loading mt-2"></div>
                </td>
              </tr>
            </tbody>
            <tbody>
              <tr v-for="(invoicePayment, index) in invoicePaymentList" :key="index">
                <td>
                  <div>
                    <a @click="openBlankInvoiceDetail(invoicePayment.invoice.id)">
                      IV{{ invoicePayment.invoice.id }}
                    </a>
                  </div>
                  <div>{{ timeToText(invoicePayment.invoice.startedAt, 'DD/MM/YYYY hh:mm') }}</div>
                </td>
                <td class="text-right">
                  {{ formatMoney(invoicePayment.invoice.debt) }}
                </td>
                <td class="text-right">
                  {{ formatMoney(invoicePayment.money) }}
                </td>
              </tr>
              <tr v-for="(visitPayment, index) in visitPaymentList" :key="index">
                <td>
                  <div>
                    <a @click="openBlankVisitDetail(visitPayment.visit.id)">
                      VS{{ visitPayment.visit.id }}
                    </a>
                  </div>
                  <div>{{ timeToText(visitPayment.visit.startedAt, 'DD/MM/YYYY hh:mm') }}</div>
                </td>
                <td class="text-right">
                  {{ formatMoney(visitPayment.visit.debt) }}
                </td>
                <td class="text-right">
                  {{ formatMoney(visitPayment.money) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex items-center mt-3">
          <div style="width: 100px; flex: none">Công nợ:</div>
          <div style="font-size: 16px; padding-left: 12px">{{ formatMoney(openDebt) }}</div>
        </div>
        <div class="w-full flex items-center mt-3">
          <div style="width: 100px; flex: none">Số tiền trả:</div>
          <div class="flex-1">
            <InputMoney
              ref="inputMoneyPay"
              v-model:value="money"
              :validate="{ lte: openDebt, gt: 0 }"
              required
              @update:value="calculatorEachVoucherPayment"
            />
          </div>
          <VueButton color="blue" @click="handleClickPayAllDebt"> Tất cả </VueButton>
        </div>
        <div class="flex items-center mt-3">
          <div style="width: 100px; flex: none">Ghi chú:</div>
          <InputText v-model:value="note" />
        </div>
      </div>

      <div class="p-4">
        <div class="flex justify-end gap-4">
          <VueButton type="reset" @click="closeModal">
            <CloseOutlined />
            Hủy bỏ
          </VueButton>
          <VueButton type="submit" color="blue" :loading="saveLoading">
            <template #icon>
              <SaveOutlined />
            </template>
            Xác nhận trả nợ
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>
