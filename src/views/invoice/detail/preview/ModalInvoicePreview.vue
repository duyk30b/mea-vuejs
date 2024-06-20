<script setup lang="ts">
import { CloseOutlined, SettingOutlined } from '@ant-design/icons-vue'
import { computed, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import VueModal from '../../../../common/VueModal.vue'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useScreenStore } from '../../../../modules/_me/screen.store'
import { Invoice } from '../../../../modules/invoice'
import { timeToText } from '../../../../utils'
import ModalInvoicePreviewSettingScreen from './ModalInvoicePreviewSettingScreen.vue'

const modalInvoicePreviewSettingScreen =
  ref<InstanceType<typeof ModalInvoicePreviewSettingScreen>>()

const screenStore = useScreenStore()
const meStore = useMeStore()
const { formatMoney } = screenStore

const showModal = ref(false)
const invoice = ref(Invoice.blank())

const openModal = async (data: Invoice) => {
  showModal.value = true
  invoice.value = data
}

const handleClose = () => {
  showModal.value = false
  invoice.value = Invoice.blank()
}

const colspan = computed(() => {
  return 3 + Number(screenStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.unit)
})

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <div class="bg-white">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Hóa đơn</div>
        <div
          style="font-size: 1.2rem"
          class="px-4 cursor-pointer"
          @click="modalInvoicePreviewSettingScreen?.openModal()"
        >
          <SettingOutlined />
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="handleClose">
          <CloseOutlined />
        </div>
      </div>

      <div class="p-4">
        <div class="flex justify-between">
          <div class="flex flex-col items-center">
            <div>{{ meStore.organization.name }}</div>
            <div>{{ meStore.organization.phone }}</div>
          </div>
          <div class="flex flex-col items-center">
            <div>Mã KH: C{{ invoice.customerId }}</div>
            <div>Mã HĐ: IV{{ invoice.id }}</div>
          </div>
        </div>
        <div style="text-align: center; font-size: 1.2rem; font-weight: bold; line-height: 2.5">
          HÓA ĐƠN
        </div>
        <div>
          <div class="flex">
            <div style="width: 6rem">Khách hàng:</div>
            <div>{{ invoice.customer?.fullName }}</div>
          </div>
          <div class="flex">
            <div style="width: 6rem">Địa chỉ:</div>
            <div>{{ invoice.customer?.addressString }}</div>
          </div>
        </div>
        <div>
          <table class="invoice-preview mt-2">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên</th>
                <th v-if="screenStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.unit">ĐV</th>
                <th>SL</th>
                <th>Đ.Giá</th>
                <th>T.Tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(invoiceItem, index) in invoice.invoiceItems" :key="index">
                <td class="text-center">
                  {{ index + 1 }}
                </td>
                <td>
                  <div class="text-justify">
                    <span v-if="invoiceItem.productId">
                      {{ invoiceItem.product!.brandName }}
                    </span>
                    <span v-if="invoiceItem.procedureId">
                      {{ invoiceItem.procedure!.name }}
                    </span>
                  </div>
                  <div v-if="invoiceItem.productId">
                    <div
                      v-if="screenStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.substance"
                      style="font-size: 0.8rem"
                    >
                      {{ invoiceItem.product!.substance }}
                    </div>
                    <div
                      v-if="
                        screenStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.batch &&
                        invoiceItem.batchId
                      "
                      style="font-size: 0.8rem"
                      class="flex gap-2"
                    >
                      Lô {{ invoiceItem.batch!.lotNumber }} - HSD
                      {{ timeToText(invoiceItem.batch!.expiryDate) }}
                    </div>
                    <div
                      v-if="screenStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.hintUsage"
                      style="font-size: 0.8rem; font-style: italic"
                    >
                      {{ invoiceItem.hintUsage }}
                    </div>
                  </div>
                </td>
                <td
                  v-if="screenStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.unit"
                  class="text-center"
                >
                  {{ invoiceItem.unitName || 'Lần' }}
                </td>
                <td class="text-center">
                  {{ invoiceItem.quantity }}
                </td>
                <td class="text-right">
                  <div
                    v-if="
                      screenStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.expectedPrice &&
                      invoiceItem.discountMoney != 0
                    "
                    style="color: rgb(255, 102, 0)"
                  >
                    <del
                      ><i
                        ><small>
                          {{ formatMoney(invoiceItem.expectedPrice) }}
                        </small></i
                      ></del
                    >
                  </div>
                  <div>{{ formatMoney(invoiceItem.actualPrice) }}</div>
                </td>
                <td class="text-right">
                  {{ formatMoney(invoiceItem.actualPrice * invoiceItem.quantity) }}
                </td>
              </tr>
              <tr v-if="screenStore.SCREEN_INVOICE_PREVIEW.paymentInfo.itemsActualMoney">
                <td :colspan="colspan" style="text-align: right">
                  <b>Tiền hàng</b>
                </td>
                <td :colspan="2" style="text-align: right">
                  <b>
                    {{ formatMoney(invoice.itemsActualMoney) }}
                  </b>
                </td>
              </tr>
              <tr v-if="screenStore.SCREEN_INVOICE_PREVIEW.paymentInfo.discount">
                <td :colspan="colspan" style="text-align: right">Chiết khấu</td>
                <td :colspan="2" style="text-align: right">
                  {{ formatMoney(invoice.discountMoney) }}
                </td>
              </tr>
              <tr v-if="screenStore.SCREEN_INVOICE_PREVIEW.paymentInfo.surcharge">
                <td :colspan="colspan" style="text-align: right">Phụ phí</td>
                <td :colspan="2" style="text-align: right">
                  {{ formatMoney(invoice.surcharge) }}
                </td>
              </tr>
              <tr>
                <td :colspan="colspan" style="text-align: right">
                  <b>Tổng tiền</b>
                </td>
                <td :colspan="2" style="text-align: right">
                  <b>
                    {{ formatMoney(invoice.totalMoney) }}
                  </b>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex justify-end mt-4">
          Ngày tạo đơn:
          {{ timeToText(invoice.startedAt, 'hh:mm DD/MM/YY') }}
        </div>
      </div>

      <div class="p-4 flex justify-center">
        <VueButton @click="handleClose">
          <CloseOutlined />
          Đóng lại
        </VueButton>
      </div>
    </div>
  </VueModal>
  <ModalInvoicePreviewSettingScreen ref="modalInvoicePreviewSettingScreen" />
</template>

<style lang="scss" scoped>
table.invoice-preview {
  width: 100%;

  td,
  th {
    padding: 0.2em 0.5em;
    border: 1px solid #c9c9c9;
    white-space: normal;
    word-wrap: break-word !important;
  }
}
</style>
