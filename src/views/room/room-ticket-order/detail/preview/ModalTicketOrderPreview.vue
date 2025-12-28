<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose, IconSetting } from '@/common/icon-antd'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Ticket } from '@/modules/ticket'
import { ESString, timeToText } from '@/utils'
import { computed, ref } from 'vue'
import TicketOrderModalPreviewSetting from './ModalTicketOrderPreviewSetting.vue'

const ticketOrderModalPreviewSetting = ref<InstanceType<typeof TicketOrderModalPreviewSetting>>()

const { organization } = MeService

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const showModal = ref(false)
const ticket = ref(Ticket.blank())

const openModal = async (data: Ticket) => {
  showModal.value = true
  ticket.value = data
}

const handleClose = () => {
  showModal.value = false
  ticket.value = Ticket.blank()
}

const colspan = computed(() => {
  return 3 + Number(settingStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.unit)
})

defineExpose({ openModal })
</script>

<template>
  <VueModal
    v-model:show="showModal"
    style="max-height: 100%"
    modalMaskStyle="background-color: rgb(89 92 135)"
  >
    <div class="bg-white">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Hóa đơn</div>
        <div
          style="font-size: 1.2rem"
          class="px-4 cursor-pointer"
          @click="ticketOrderModalPreviewSetting?.openModal()"
        >
          <IconSetting />
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="handleClose">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <div class="flex justify-between flex-wrap">
          <div class="flex flex-col items-center" style="flex-grow: 1">
            <div>{{ organization.name }}</div>
            <div style="font-weight: bold">{{ ESString.formatPhone(organization.phone) }}</div>
          </div>
          <div class="flex flex-col items-center" style="flex-grow: 1">
            <div>Mã KH: C{{ ticket.customerId }}</div>
            <div>Mã HĐ: VS{{ ticket.id }}</div>
          </div>
        </div>
        <div style="text-align: center; font-size: 1.2rem; font-weight: bold; line-height: 2.5">
          HÓA ĐƠN
        </div>
        <div>
          <div class="flex">
            <div style="width: 6rem">Khách hàng:</div>
            <div>{{ ticket.customer?.fullName }}</div>
          </div>
          <div class="flex">
            <div style="width: 6rem">Địa chỉ:</div>
            <div>{{ ESString.formatAddress(ticket.customer) }}</div>
          </div>
        </div>
        <div>
          <table class="invoice-ticket-preview mt-2">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên</th>
                <th v-if="settingStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.unit">ĐV</th>
                <th>SL</th>
                <th>Đ.Giá</th>
                <th>T.Tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(ticketProcedure, index) in ticket.ticketProcedureList" :key="index">
                <td class="auto-index text-center"></td>
                <td
                  :colspan="settingStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.unit ? '2' : '1'"
                  class="text-justify"
                >
                  {{ ticketProcedure.procedure!.name }}
                </td>
                <td class="text-center">{{ ticketProcedure.quantity }}</td>
                <td class="text-right">
                  <div
                    v-if="
                      settingStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.expectedPrice &&
                      ticketProcedure.discountMoney != 0
                    "
                    style="color: rgb(255, 102, 0)"
                  >
                    <del>
                      <i>
                        <small>
                          {{ formatMoney(ticketProcedure.expectedPrice) }}
                        </small>
                      </i>
                    </del>
                  </div>
                  <div>{{ formatMoney(ticketProcedure.actualPrice) }}</div>
                </td>
                <td class="text-right">
                  {{ formatMoney(ticketProcedure.actualPrice * ticketProcedure.quantity) }}
                </td>
              </tr>
              <tr v-for="(ticketProduct, index) in ticket.ticketProductList" :key="index">
                <td class="auto-index text-center"></td>
                <td>
                  <div class="text-justify">
                    {{ ticketProduct.product!.brandName }}
                  </div>
                  <div v-if="ticketProduct.productId">
                    <div
                      v-if="settingStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.substance"
                      style="font-size: 0.8rem"
                      class="max-line-2"
                    >
                      {{ ticketProduct.product!.substance }}
                    </div>
                    <div
                      v-if="settingStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.hintUsage"
                      style="font-size: 0.8rem; font-style: italic"
                    >
                      {{ ticketProduct.hintUsage }}
                    </div>
                  </div>
                </td>
                <td
                  v-if="settingStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.unit"
                  class="text-center"
                >
                  {{ ticketProduct.unitName || 'Lần' }}
                </td>
                <td class="text-center">
                  {{ ticketProduct.quantity }}
                </td>
                <td class="text-right">
                  <div
                    v-if="
                      settingStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.expectedPrice &&
                      ticketProduct.discountMoney != 0
                    "
                    style="color: rgb(255, 102, 0)"
                  >
                    <del>
                      <i>
                        <small>
                          {{ formatMoney(ticketProduct.expectedPrice) }}
                        </small>
                      </i>
                    </del>
                  </div>
                  <div>{{ formatMoney(ticketProduct.actualPrice) }}</div>
                </td>
                <td class="text-right">
                  {{ formatMoney(ticketProduct.actualPrice * ticketProduct.quantity) }}
                </td>
              </tr>
              <tr v-if="settingStore.SCREEN_INVOICE_PREVIEW.paymentInfo.itemsActualMoney">
                <td :colspan="colspan" style="text-align: right">
                  <b>Tiền hàng</b>
                </td>
                <td :colspan="2" style="text-align: right">
                  <span
                    v-if="ticket.itemsDiscount"
                    style="font-style: italic; font-size: 13px"
                    class="mr-2"
                  >
                    (CK: {{ formatMoney(ticket.itemsDiscount) }})
                  </span>
                  <b>
                    {{ formatMoney(ticket.procedureMoney + ticket.productMoney) }}
                  </b>
                </td>
              </tr>
              <tr v-if="settingStore.SCREEN_INVOICE_PREVIEW.paymentInfo.discount">
                <td :colspan="colspan" style="text-align: right">Chiết khấu</td>
                <td :colspan="2" style="text-align: right">
                  {{ formatMoney(ticket.discountMoney) }}
                </td>
              </tr>
              <tr v-if="settingStore.SCREEN_INVOICE_PREVIEW.paymentInfo.surcharge">
                <td :colspan="colspan" style="text-align: right">Phụ phí</td>
                <td :colspan="2" style="text-align: right">
                  {{ formatMoney(ticket.surcharge) }}
                </td>
              </tr>
              <tr>
                <td :colspan="colspan" style="text-align: right">
                  <b>Tổng tiền</b>
                </td>
                <td :colspan="2" style="text-align: right">
                  <b>
                    {{ formatMoney(ticket.totalMoney) }}
                  </b>
                </td>
              </tr>
              <tr v-if="settingStore.SCREEN_INVOICE_PREVIEW.paymentInfo.paid">
                <td :colspan="colspan" style="text-align: right">Đã thanh toán</td>
                <td :colspan="2" style="text-align: right">
                  {{ formatMoney(ticket.paidTotal) }}
                </td>
              </tr>
              <tr v-if="settingStore.SCREEN_INVOICE_PREVIEW.paymentInfo.debt">
                <td :colspan="colspan" style="text-align: right">Nợ</td>
                <td :colspan="2" style="text-align: right">
                  {{ formatMoney(ticket.debtTotal) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex justify-end mt-4">
          Ngày tạo đơn:
          {{ timeToText(ticket.createdAt, 'hh:mm DD/MM/YY') }}
        </div>
      </div>

      <div class="p-4 flex justify-center">
        <VueButton @click="handleClose" icon="close">Đóng lại</VueButton>
      </div>
    </div>
  </VueModal>
  <TicketOrderModalPreviewSetting ref="ticketOrderModalPreviewSetting" />
</template>

<style lang="scss" scoped>
table.invoice-ticket-preview {
  width: 100%;
  tbody {
    counter-reset: rowNumber 0;
    tr {
      counter-increment: rowNumber 1;
      td.auto-index:first-child::before {
        content: counter(rowNumber);
      }
    }
  }
  td,
  th {
    padding: 0.2em 0.5em;
    border: 1px solid #c9c9c9;
    white-space: normal;
    word-wrap: break-word !important;
  }
}
</style>
