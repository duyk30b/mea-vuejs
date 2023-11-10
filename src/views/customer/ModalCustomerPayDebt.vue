<script setup lang="ts">
import VueModal from '@/common/VueModal.vue'
import { InputMoney } from '@/common/vue-form'
import { CustomerPaymentService, useCustomerStore, type Customer, type CustomerPayment } from '@/modules/customer'
import { InvoiceService, InvoiceStatus, type Invoice } from '@/modules/invoice'
import { useOrganizationStore } from '@/store/organization.store'
import { timeToText } from '@/utils'
import { CloseOutlined, SaveOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const inputMoneyPay = ref<InstanceType<typeof InputMoney>>()

const emit = defineEmits<{
  (e: 'success', value: { customer: Customer }): void
}>()
const router = useRouter()

const customerStore = useCustomerStore()
const organizationStore = useOrganizationStore()
const { formatMoney } = organizationStore

const openDebt = ref(0)
const money = ref(0)
const note = ref('')
const customerId = ref(0)
const invoicePayments = ref<{ invoice: Invoice, money: number }[]>([])

const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async (customerIdProp: number, openDebtProp: number) => {
  money.value = 0
  note.value = ''
  openDebt.value = openDebtProp
  customerId.value = customerIdProp
  showModal.value = true

  const invoiceDebtList = await InvoiceService.list({
    filter: {
      customer_id: customerIdProp,
      status: InvoiceStatus.Debt,
    },
  })
  invoicePayments.value = invoiceDebtList.map((i) => ({ invoice: i, money: 0 }))
}

const closeModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (money.value === 0) {
      return message.error('Số tiền trả nợ phải khác 0')
    }
    const data = await CustomerPaymentService.payDebt({
      customer_id: customerId.value,
      note: note.value,
      invoice_payments: invoicePayments.value.map((i) => ({
        invoice_id: i.invoice.id,
        money: i.money,
      })).filter((i) => i.money > 0),
    })
    customerStore.updateOne(data.customer.id, data.customer)
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

const handleChangeMoney = (data: number) => {
  if (data <= openDebt.value) {
    money.value = data
  } else {
    money.value = openDebt.value
    inputMoneyPay.value?.$forceUpdate()
  }
  calculatorEachInvoicePayment()
}

const handleClickPayAllDebt = () => {
  money.value = openDebt.value
  calculatorEachInvoicePayment()
}

const calculatorEachInvoicePayment = () => {
  let totalMoney = money.value
  invoicePayments.value.forEach((item) => {
    let number = Math.min(totalMoney, item.invoice.debt)
    item.money = number
    totalMoney = totalMoney - number
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede;">
        <div class="flex-1 font-medium" style="font-size: 16px;">Công nợ: {{ formatMoney(openDebt) }}</div>
        <div style="font-size: 1.2rem;" class="px-4 cursor-pointer" @click="closeModal">
          <CloseOutlined />
        </div>
      </div>

      <div class="p-4">
        <div class="w-full flex items-center">
          <div style="width: 100px; flex: none;">Số tiền trả:</div>
          <div class="flex-1">
            <InputMoney ref="inputMoneyPay" :value="money" @update:value="handleChangeMoney" />
          </div>
          <a-button type="primary" @click="handleClickPayAllDebt">Tất cả</a-button>
        </div>
        <div class="mt-4">Trả tiền vào đơn (tự động)</div>
        <div class="mt-2">
          <table class="table-mobile">
            <thead>
              <tr>
                <th> Đơn </th>
                <th> Số tiền trả </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(invoicePayment, index) in invoicePayments" :key="index">
                <td>
                  <div>
                    <a @click="openBlankInvoiceDetail(invoicePayment.invoice.id)">
                      IV{{ invoicePayment.invoice.id }}
                    </a> - Nợ
                    <span class="font-medium"> {{ formatMoney(invoicePayment.invoice.debt) }}</span>
                  </div>
                  <div>{{ timeToText(invoicePayment.invoice.createTime, 'DD/MM/YYYY hh:mm') }}</div>
                </td>
                <td class="text-right">{{ formatMoney(invoicePayment.money) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex items-center mt-3">
          <div style="width: 100px; flex: none;">Ghi chú:</div>
          <a-input v-model:value="note" />
        </div>
      </div>

      <div class="p-4">
        <div class="flex justify-end gap-4">
          <a-button @click="closeModal">
            <template #icon>
              <CloseOutlined />
            </template>
            Hủy bỏ
          </a-button>
          <a-button type="primary" @click="handleSave">
            <template #icon>
              <SaveOutlined />
            </template>
            Xác nhận trả nợ
          </a-button>
        </div>
      </div>
    </div>
  </VueModal>
</template>