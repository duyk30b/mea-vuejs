<script setup lang="ts">
import { CloseOutlined, SettingOutlined } from '@ant-design/icons-vue'
import { computed, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import VueModal from '../../../../common/VueModal.vue'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { Invoice } from '../../../../modules/invoice'
import { timeToText } from '../../../../utils'
import ModalInvoicePreviewSettingScreen from './ModalInvoicePreviewSettingScreen.vue'
import { Visit } from '../../../../modules/visit'

const modalInvoicePreviewSettingScreen =
  ref<InstanceType<typeof ModalInvoicePreviewSettingScreen>>()

const settingStore = useSettingStore()
const meStore = useMeStore()
const { formatMoney } = settingStore

const showModal = ref(false)
const visit = ref(Visit.blank())

const openModal = async (data: Visit) => {
  showModal.value = true
  visit.value = data
}

const handleClose = () => {
  showModal.value = false
  visit.value = Visit.blank()
}

const colspan = computed(() => {
  return 3 + Number(settingStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.unit)
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
          @click="modalInvoicePreviewSettingScreen?.openModal()">
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
            <div>Mã KH: C{{ visit.customerId }}</div>
            <div>Mã HĐ: VS{{ visit.id }}</div>
          </div>
        </div>
        <div style="text-align: center; font-size: 1.2rem; font-weight: bold; line-height: 2.5">
          HÓA ĐƠN
        </div>
        <div>
          <div class="flex">
            <div style="width: 6rem">Khách hàng:</div>
            <div>{{ visit.customer?.fullName }}</div>
          </div>
          <div class="flex">
            <div style="width: 6rem">Địa chỉ:</div>
            <div>{{ visit.customer?.addressString }}</div>
          </div>
        </div>
        <div>
          <table class="invoice-visit-preview mt-2">
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
              <tr v-for="(visitProcedure, index) in visit.visitProcedureList" :key="index">
                <td class="text-center">
                  {{ index + 1 }}
                </td>
                <td
                  :colspan="settingStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.unit ? '2' : '1'"
                  class="text-justify">
                  {{ visitProcedure.procedure!.name }}
                </td>
                <td class="text-center">{{ visitProcedure.quantity }}</td>
                <td class="text-right">
                  <div
                    v-if="
                      settingStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.expectedPrice &&
                      visitProcedure.discountMoney != 0
                    "
                    style="color: rgb(255, 102, 0)">
                    <del>
                      <i>
                        <small>
                          {{ formatMoney(visitProcedure.expectedPrice) }}
                        </small>
                      </i>
                    </del>
                  </div>
                  <div>{{ formatMoney(visitProcedure.actualPrice) }}</div>
                </td>
                <td class="text-right">
                  {{ formatMoney(visitProcedure.actualPrice * visitProcedure.quantity) }}
                </td>
              </tr>
              <tr v-for="(visitProduct, index) in visit.visitProductList" :key="index">
                <td class="text-center">
                  {{ index + 1 }}
                </td>
                <td>
                  <div class="text-justify">
                    {{ visitProduct.product!.brandName }}
                  </div>
                  <div v-if="visitProduct.productId">
                    <div
                      v-if="settingStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.substance"
                      style="font-size: 0.8rem">
                      {{ visitProduct.product!.substance }}
                    </div>
                    <div
                      v-if="
                        settingStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.batch &&
                        visitProduct.batchId
                      "
                      style="font-size: 0.8rem"
                      class="flex gap-2">
                      Lô {{ visitProduct.batch!.lotNumber }} - HSD
                      {{ timeToText(visitProduct.batch!.expiryDate) }}
                    </div>
                    <div
                      v-if="settingStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.hintUsage"
                      style="font-size: 0.8rem; font-style: italic">
                      {{ visitProduct.hintUsage }}
                    </div>
                  </div>
                </td>
                <td
                  v-if="settingStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.unit"
                  class="text-center">
                  {{ visitProduct.unitName || 'Lần' }}
                </td>
                <td class="text-center">
                  {{ visitProduct.quantity }}
                </td>
                <td class="text-right">
                  <div
                    v-if="
                      settingStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.expectedPrice &&
                      visitProduct.discountMoney != 0
                    "
                    style="color: rgb(255, 102, 0)">
                    <del>
                      <i>
                        <small>
                          {{ formatMoney(visitProduct.expectedPrice) }}
                        </small>
                      </i>
                    </del>
                  </div>
                  <div>{{ formatMoney(visitProduct.actualPrice) }}</div>
                </td>
                <td class="text-right">
                  {{ formatMoney(visitProduct.actualPrice * visitProduct.quantity) }}
                </td>
              </tr>
              <tr v-if="settingStore.SCREEN_INVOICE_PREVIEW.paymentInfo.itemsActualMoney">
                <td :colspan="colspan" style="text-align: right">
                  <b>Tiền hàng</b>
                </td>
                <td :colspan="2" style="text-align: right">
                  <b>
                    {{
                      formatMoney(
                        visit.proceduresMoney + visit.productsMoney + visit.radiologyMoney
                      )
                    }}
                  </b>
                </td>
              </tr>
              <tr v-if="settingStore.SCREEN_INVOICE_PREVIEW.paymentInfo.discount">
                <td :colspan="colspan" style="text-align: right">Chiết khấu</td>
                <td :colspan="2" style="text-align: right">
                  {{ formatMoney(visit.discountMoney) }}
                </td>
              </tr>
              <tr v-if="settingStore.SCREEN_INVOICE_PREVIEW.paymentInfo.surcharge">
                <td :colspan="colspan" style="text-align: right">Phụ phí</td>
                <td :colspan="2" style="text-align: right">
                  {{ formatMoney(visit.surcharge) }}
                </td>
              </tr>
              <tr>
                <td :colspan="colspan" style="text-align: right">
                  <b>Tổng tiền</b>
                </td>
                <td :colspan="2" style="text-align: right">
                  <b>
                    {{ formatMoney(visit.totalMoney) }}
                  </b>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex justify-end mt-4">
          Ngày tạo đơn:
          {{ timeToText(visit.registeredAt, 'hh:mm DD/MM/YY') }}
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
table.invoice-visit-preview {
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
