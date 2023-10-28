<script setup lang="ts">
import { CloseOutlined, SaveOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { ref } from 'vue'
import VueModal from '../../../common/VueModal.vue'
import { InputMoney } from '../../../common/vue-form'
import { PaymentType } from '../../../modules/enum'
import { Invoice, InvoiceService, InvoiceStatus } from '../../../modules/invoice'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { timeToText } from '../../../utils'
import CustomerPaymentTypeTag from '../../../views/customer/CustomerPaymentTypeTag.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { PermissionId } from '../../../modules/permission/permission.enum'

const props = withDefaults(defineProps<{ invoice: Invoice }>(), { invoice: () => Invoice.blank() })
const emit = defineEmits<{ (e: 'success'): void }>()

const screenStore = useScreenStore()
const { formatMoney } = screenStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const showModal = ref(false)
const paymentLoading = ref(false)

const money = ref(0)

const openModal = async () => {
  money.value = 0
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handlePayment = async () => {
  paymentLoading.value = true
  try {
    if (props.invoice.status === InvoiceStatus.Draft && money.value < 0) {
      return message.error('Số tiền thanh toán không được nhỏ hơn 0')
    }
    if (props.invoice.status === InvoiceStatus.AwaitingShipment && money.value <= 0) {
      return message.error('Số tiền thanh toán phải lớn hơn 0')
    }
    if (props.invoice.status === InvoiceStatus.Debt && money.value <= 0) {
      return message.error('Số tiền thanh toán phải lớn hơn 0')
    }

    if ([InvoiceStatus.Draft, InvoiceStatus.AwaitingShipment].includes(props.invoice.status)) {
      await InvoiceService.prepayment(props.invoice.id, money.value)
    }
    if ([InvoiceStatus.Debt].includes(props.invoice.status)) {
      await InvoiceService.payDebt(props.invoice.id, money.value)
    }
    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:39 ~ handlePayment ~ error:', error)
  } finally {
    paymentLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 600px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Thông tin thanh toán</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <CloseOutlined />
        </div>
      </div>

      <div class="p-4">
        <div class="text-right">
          <span class="mr-2">Tổng tiền đơn: </span>
          <span class="font-bold" style="font-size: 16px"> {{ formatMoney(invoice.revenue) }}</span>
        </div>
        <table class="table-mobile mt-2">
          <thead>
            <tr>
              <th>#</th>
              <th>Thời gian</th>
              <th>Tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="invoice.customerPayments.length == 0">
              <td colspan="20" class="text-center">Chưa thanh toán</td>
            </tr>
            <tr v-for="(customerPayment, index) in invoice.customerPayments" :key="index">
              <td class="text-center">
                {{ index + 1 }}
              </td>
              <td class="text-left">
                <div>
                  {{ timeToText(customerPayment.createdAt, 'DD/MM/YY hh:mm') }}
                </div>
                <div>
                  <CustomerPaymentTypeTag :type="customerPayment.type" />
                </div>
                <div v-if="customerPayment.note" style="font-size: 0.8rem">
                  {{ customerPayment.note }}
                </div>
                <div v-if="customerPayment.description" style="font-size: 0.8rem">
                  {{ customerPayment.description }}
                </div>
              </td>
              <td class="text-right" style="padding-right: 12px">
                <div>{{ formatMoney(customerPayment.paid) }}</div>
                <div v-if="customerPayment.type === PaymentType.ImmediatePayment">
                  Ghi nợ: {{ formatMoney(customerPayment.invoiceCloseDebt) }}
                </div>
                <div
                  v-if="
                    customerPayment.type === PaymentType.PayDebt ||
                    customerPayment.type === PaymentType.ReceiveRefund
                  "
                >
                  Nợ còn: {{ formatMoney(customerPayment.invoiceCloseDebt) }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          v-if="
            [InvoiceStatus.Draft, InvoiceStatus.AwaitingShipment, InvoiceStatus.Debt].includes(
              invoice.status
            )
          "
        >
          <table class="w-full mt-4">
            <tbody>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap; width: 30%">
                  <span
                    v-if="
                      [InvoiceStatus.Draft, InvoiceStatus.AwaitingShipment].includes(invoice.status)
                    "
                  >
                    Chưa thanh toán :
                  </span>
                  <span v-if="[InvoiceStatus.Debt].includes(invoice.status)"> Nợ : </span>
                </td>
                <td class="w-full font-bold pr-3 text-right" style="font-size: 16px">
                  {{ formatMoney(invoice.revenue - invoice.paid) }}
                </td>
              </tr>
              <tr>
                <td class="py-1"></td>
                <td></td>
              </tr>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">
                  <span
                    v-if="
                      [InvoiceStatus.Draft, InvoiceStatus.AwaitingShipment].includes(invoice.status)
                    "
                  >
                    Thanh toán :
                  </span>
                  <span v-if="[InvoiceStatus.Debt].includes(invoice.status)"> Trả nợ : </span>
                </td>
                <td>
                  <div class="flex items-stretch pl-6">
                    <div>
                      <a-button type="default" @click="money = invoice.revenue - invoice.paid">
                        Tất cả
                      </a-button>
                    </div>
                    <div class="flex-1">
                      <InputMoney v-model:value="money" text-align="right" />
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
                  <span
                    v-if="
                      [InvoiceStatus.Draft, InvoiceStatus.AwaitingShipment].includes(invoice.status)
                    "
                  >
                    Còn thiếu :
                  </span>
                  <span v-if="[InvoiceStatus.Debt].includes(invoice.status)"> Nợ còn : </span>
                </td>
                <td class="w-full font-bold text-right pr-3" style="font-size: 16px">
                  {{ formatMoney(invoice.revenue - invoice.paid - money) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="pb-4 flex justify-center gap-4">
        <div
          v-if="
            permissionIdMap[PermissionId.INVOICE_PREPAYMENT] &&
            [InvoiceStatus.Draft, InvoiceStatus.AwaitingShipment].includes(invoice.status)
          "
        >
          <a-button type="primary" :loading="paymentLoading" @click="handlePayment">
            <template #icon>
              <SaveOutlined />
            </template>
            Thanh toán
          </a-button>
        </div>

        <div
          v-else-if="
            permissionIdMap[PermissionId.INVOICE_PREPAYMENT] &&
            [InvoiceStatus.Debt].includes(invoice.status)
          "
        >
          <a-button type="primary" :loading="paymentLoading" @click="handlePayment">
            <template #icon>
              <SaveOutlined />
            </template>
            Trả nợ
          </a-button>
        </div>
        <div v-else>
          <a-button @click="closeModal">
            <template #icon>
              <CloseOutlined />
            </template>
            Đóng lại
          </a-button>
        </div>
      </div>
    </div>
  </VueModal>
</template>
