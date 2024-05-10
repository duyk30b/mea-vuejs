<script setup lang="ts">
import { ExclamationCircleOutlined, FileSearchOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import { Invoice } from '../../../modules/invoice'
import { InvoiceItemType } from '../../../modules/invoice-item/invoice-item.model'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { timeToText } from '../../../utils'
import ModalProcedureDetail from '../../../views/procedure/detail/ModalProcedureDetail.vue'
import ModalProductDetail from '../../../views/product/detail/ModalProductDetail.vue'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()

const screenStore = useScreenStore()
const { formatMoney, isMobile } = screenStore

const props = withDefaults(defineProps<{ invoice: Invoice }>(), { invoice: () => Invoice.blank() })
const emit = defineEmits<{ (e: 'show-invoice-payment'): void }>()

const handleClickInvoicePaymentInfo = () => {
  emit('show-invoice-payment')
}
</script>

<template>
  <ModalProductDetail ref="modalProductDetail" />
  <ModalProcedureDetail ref="modalProcedureDetail" />

  <div v-if="isMobile">
    <table class="table-mobile">
      <thead>
        <tr>
          <th>#</th>
          <th>Sản phẩm</th>
          <th>SL</th>
          <th>TT</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(invoiceItem, index) in invoice.invoiceItems || []" :key="index">
          <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
            {{ index + 1 }}
          </td>
          <td>
            <div v-if="invoiceItem.productId">
              <div class="font-medium text-justify">
                {{ invoiceItem.product!.brandName }}
                <a
                  v-if="screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.detail"
                  class="ml-1"
                  @click="modalProductDetail?.openModal(invoiceItem.product!)"
                >
                  <FileSearchOutlined />
                </a>
              </div>
              <div
                v-if="screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.substance"
                style="font-size: 0.8rem"
                class="text-justify"
              >
                {{ invoiceItem.product!.substance }}
              </div>
              <div
                v-if="
                  screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.batch && invoiceItem.batchId
                "
                class="flex gap-2 flex-wrap"
                style="font-size: 0.8rem"
              >
                Số Lô: {{ invoiceItem.batch!.lotNumber }} - HSD
                {{ timeToText(invoiceItem.batch!.expiryDate, 'DD/MM/YY') }}
              </div>
              <div
                v-if="screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.hintUsage"
                style="font-size: 0.8rem"
              >
                {{ invoiceItem.hintUsage }}
              </div>
            </div>
            <div v-if="invoiceItem.procedureId">
              <div class="font-medium text-justify">
                {{ invoiceItem.procedure!.name }}
                <a
                  v-if="screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.detail"
                  class="ml-1"
                  @click="modalProcedureDetail?.openModal(invoiceItem.procedure!)"
                >
                  <FileSearchOutlined />
                </a>
              </div>
            </div>
            <div class="flex gap-2" style="font-size: 0.8rem">
              <div v-if="screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.expectedPrice">
                NY:
                <span class="font-medium">
                  {{ formatMoney(invoiceItem.expectedPrice * invoiceItem.unit.rate) }}
                </span>
                <span v-if="screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit">
                  /{{ invoiceItem.unit.name }}
                </span>
              </div>
              <div
                v-if="
                  invoiceItem.discountMoney &&
                  screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount
                "
              >
                - CK:
                <span v-if="invoiceItem.discountType === 'VNĐ'" class="font-medium">
                  {{ formatMoney(invoiceItem.discountMoney * invoiceItem.unit.rate) }}
                </span>
                <span v-if="invoiceItem.discountType === '%'" class="font-medium">
                  {{ invoiceItem.discountPercent || 0 }}%
                </span>
              </div>
              <div>
                - ĐG:
                <span class="font-medium">
                  {{ formatMoney(invoiceItem.actualPrice * invoiceItem.unit.rate) }}
                </span>
                <span v-if="screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit">
                  /{{ invoiceItem.unit.name }}
                </span>
              </div>
            </div>
          </td>
          <td class="text-center whitespace-nowrap">
            {{ invoiceItem.quantity / invoiceItem.unit.rate }}
          </td>
          <td class="text-right whitespace-nowrap">
            {{ formatMoney(invoiceItem.actualPrice * invoiceItem.quantity) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-if="!isMobile" class="px-4 table-wrapper w-full">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Tên</th>
          <th>S.Lượng</th>
          <th v-if="screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit">Đ.Vị</th>
          <th v-if="screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount">C.Khấu</th>
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
            <div v-if="invoiceItem.productId">
              <div class="text-justify font-medium">
                {{ invoiceItem.product!.brandName }}
                <a
                  v-if="screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.detail"
                  class="ml-1"
                  @click="modalProductDetail?.openModal(invoiceItem.product!)"
                >
                  <FileSearchOutlined />
                </a>
              </div>
              <div
                v-if="screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.substance"
                style="font-size: 0.8rem"
              >
                {{ invoiceItem.product!.substance }}
              </div>
              <div
                v-if="
                  screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.batch && invoiceItem.batchId
                "
                style="font-size: 0.8rem"
                class="flex gap-2"
              >
                Số lô {{ invoiceItem.batch!.lotNumber }} - HSD
                {{ timeToText(invoiceItem.batch!.expiryDate) }}
              </div>
              <div
                v-if="screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.hintUsage"
                style="font-size: 0.8rem"
              >
                {{ invoiceItem.hintUsage }}
              </div>
            </div>
            <div
              v-if="invoiceItem.procedureId"
              class="text-justify font-medium whitespace-nowrap"
              style="word-break: break-all"
            >
              {{ invoiceItem.procedure!.name }}
              <a
                v-if="screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.detail"
                class="ml-1"
                @click="modalProcedureDetail?.openModal(invoiceItem.procedure!)"
              >
                <FileSearchOutlined />
              </a>
            </div>
          </td>
          <td class="text-center">
            {{ invoiceItem.quantity / invoiceItem.unit.rate }}
          </td>
          <td v-if="screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit" class="text-center">
            {{ invoiceItem.unit.name || 'Lần' }}
          </td>
          <td
            v-if="screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount"
            class="text-center"
          >
            <a-tag
              v-if="invoiceItem.discountType === 'VNĐ'"
              color="success"
              style="cursor: pointer"
            >
              {{ formatMoney(invoiceItem.discountMoney * invoiceItem.unit.rate) }}
            </a-tag>
            <a-tag v-if="invoiceItem.discountType === '%'" color="success" style="cursor: pointer">
              {{ invoiceItem.discountPercent || 0 }}%
            </a-tag>
          </td>
          <td class="text-right">
            <div
              v-if="
                screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.expectedPrice &&
                invoiceItem.discountMoney
              "
              class="text-xs italic line-through"
              style="color: #ff4d4f"
            >
              {{ formatMoney(invoiceItem.expectedPrice * invoiceItem.unit.rate) }}
            </div>
            <div>{{ formatMoney(invoiceItem.actualPrice * invoiceItem.unit.rate) }}</div>
          </td>
          <td class="text-right">
            {{ formatMoney(invoiceItem.actualPrice * invoiceItem.quantity) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="md:px-4">
    <table class="table-mobile">
      <tbody>
        <tr v-if="screenStore.SCREEN_INVOICE_DETAIL.paymentInfo.itemsActualMoney">
          <td class="text-right font-medium" style="width: 60%">Tiền hàng</td>
          <td class="text-right font-medium">
            {{ formatMoney(invoice.itemsActualMoney) }}
          </td>
        </tr>
        <tr v-if="screenStore.SCREEN_INVOICE_DETAIL.paymentInfo.discount || invoice.discountMoney">
          <td class="text-right">Chiết khấu</td>
          <td class="text-right">
            <a-tag v-if="invoice.discountType === '%'" color="success">
              {{ invoice.discountPercent || 0 }}%
            </a-tag>
            {{ formatMoney(invoice.discountMoney) }}
          </td>
        </tr>
        <tr v-if="screenStore.SCREEN_INVOICE_DETAIL.paymentInfo.surcharge || invoice.surcharge">
          <td class="text-right">
            Phụ phí
            <span
              v-if="
                (invoice.invoiceSurcharges || []).length > 1 ||
                ((invoice.invoiceSurcharges || []).length == 1 &&
                  invoice.invoiceSurcharges![0].key !== '_unknown')
              "
              class="ml-1"
            >
              ({{
                invoice
                  .invoiceSurcharges!.map((i) => `${i.name}: ${formatMoney(i.money)}`)
                  .join(' - ')
              }})
            </span>
          </td>
          <td class="text-right">
            {{ formatMoney(invoice.surcharge) }}
          </td>
        </tr>
        <tr>
          <td class="text-right font-medium">Tổng tiền</td>
          <td class="text-right font-medium">
            {{ formatMoney(invoice.revenue) }}
          </td>
        </tr>
        <tr
          v-if="
            screenStore.SCREEN_INVOICE_DETAIL.paymentInfo.paid || invoice.paid !== invoice.revenue
          "
        >
          <td class="text-right cursor-pointer" @click="handleClickInvoicePaymentInfo">
            <span class="mr-1"> Thanh toán </span>
            <ExclamationCircleOutlined />
          </td>
          <td class="text-right">
            {{ formatMoney(invoice.paid) }}
          </td>
        </tr>
        <tr v-if="screenStore.SCREEN_INVOICE_DETAIL.paymentInfo.debt || invoice.debt">
          <td class="text-right">Ghi nợ</td>
          <td class="text-right">
            {{ formatMoney(invoice.debt) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped></style>
