<script setup lang="ts">
import { ExclamationCircleOutlined, FileSearchOutlined } from '@ant-design/icons-vue'
import { computed, ref } from 'vue'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { InvoiceStatus } from '../../../modules/invoice'
import { timeToText } from '../../../utils'
import ModalProcedureDetail from '../../../views/procedure/detail/ModalProcedureDetail.vue'
import ModalProductDetail from '../../../views/product/detail/ModalProductDetail.vue'
import { invoice } from './invoice-detail.ref'
import { PaymentViewType } from '../../../modules/enum'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()

const screenStore = useScreenStore()
const { formatMoney, isMobile } = screenStore

const emit = defineEmits<{ (e: 'showInvoicePayment', value: PaymentViewType): void }>()

const showModalInvoicePayment = (paymentView: PaymentViewType) => {
  emit('showInvoicePayment', paymentView)
}
const colspan = computed(() => {
  if (isMobile) return 2
  return (
    3 +
    Number(screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit) +
    Number(screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount)
  )
})
</script>

<template>
  <ModalProductDetail ref="modalProductDetail" />
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <div class="px-4 table-wrapper w-full" :class="isMobile ? '' : 'px-4 w-full'">
    <table>
      <template v-if="isMobile">
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
                    @click="modalProductDetail?.openModal(invoiceItem.productId)"
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
                    @click="modalProcedureDetail?.openModal(invoiceItem.procedureId)"
                  >
                    <FileSearchOutlined />
                  </a>
                </div>
              </div>
              <div class="flex gap-2" style="font-size: 0.8rem">
                <div v-if="screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.expectedPrice">
                  NY:
                  <span class="font-medium">
                    {{ formatMoney(invoiceItem.expectedPrice * invoiceItem.unitRate) }}
                  </span>
                  <span
                    v-if="
                      screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit &&
                      invoiceItem.unitName
                    "
                  >
                    /{{ invoiceItem.unitName }}
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
                    {{ formatMoney(invoiceItem.discountMoney * invoiceItem.unitRate) }}
                  </span>
                  <span v-if="invoiceItem.discountType === '%'" class="font-medium">
                    {{ invoiceItem.discountPercent || 0 }}%
                  </span>
                </div>
                <div>
                  - ĐG:
                  <span class="font-medium">
                    {{ formatMoney(invoiceItem.actualPrice * invoiceItem.unitRate) }}
                  </span>
                  <span
                    v-if="
                      screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit &&
                      invoiceItem.unitName
                    "
                  >
                    /{{ invoiceItem.unitName }}
                  </span>
                </div>
              </div>
            </td>
            <td class="text-center whitespace-nowrap">
              {{ invoiceItem.quantity / invoiceItem.unitRate }}
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(invoiceItem.actualPrice * invoiceItem.quantity) }}
            </td>
          </tr>
        </tbody>
      </template>
      <template v-if="!isMobile">
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
                    @click="modalProductDetail?.openModal(invoiceItem.productId)"
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
                  @click="modalProcedureDetail?.openModal(invoiceItem.procedureId)"
                >
                  <FileSearchOutlined />
                </a>
              </div>
            </td>
            <td class="text-center">
              {{ invoiceItem.quantity / invoiceItem.unitRate }}
            </td>
            <td v-if="screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit" class="text-center">
              {{ invoiceItem.unitName || 'Lần' }}
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
                {{ formatMoney(invoiceItem.discountMoney * invoiceItem.unitRate) }}
              </a-tag>
              <a-tag
                v-if="invoiceItem.discountType === '%'"
                color="success"
                style="cursor: pointer"
              >
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
                style="color: var(--text-red)"
              >
                {{ formatMoney(invoiceItem.expectedPrice * invoiceItem.unitRate) }}
              </div>
              <div>{{ formatMoney(invoiceItem.actualPrice * invoiceItem.unitRate) }}</div>
            </td>
            <td class="text-right">
              {{ formatMoney(invoiceItem.actualPrice * invoiceItem.quantity) }}
            </td>
          </tr>
          <tr v-if="screenStore.SCREEN_INVOICE_DETAIL.paymentInfo.itemsActualMoney">
            <td class="text-right font-medium" :colspan="colspan">Tiền hàng</td>
            <td class="text-right font-medium" :colspan="2">
              {{ formatMoney(invoice.itemsActualMoney) }}
            </td>
          </tr>
          <tr
            v-if="screenStore.SCREEN_INVOICE_DETAIL.paymentInfo.discount || invoice.discountMoney"
          >
            <td class="text-right" :colspan="colspan">Chiết khấu</td>
            <td class="text-right" :colspan="2">
              <a-tag v-if="invoice.discountType === '%'" color="success">
                {{ invoice.discountPercent || 0 }}%
              </a-tag>
              {{ formatMoney(invoice.discountMoney) }}
            </td>
          </tr>
          <tr v-if="screenStore.SCREEN_INVOICE_DETAIL.paymentInfo.surcharge || invoice.surcharge">
            <td class="text-right" :colspan="colspan">
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
            <td class="text-right" :colspan="2">
              {{ formatMoney(invoice.surcharge) }}
            </td>
          </tr>
          <tr>
            <td class="text-right font-medium" :colspan="colspan">Tổng tiền</td>
            <td class="text-right font-medium" :colspan="2">
              {{ formatMoney(invoice.totalMoney) }}
            </td>
          </tr>
          <tr v-if="screenStore.SCREEN_INVOICE_DETAIL.paymentInfo.profit">
            <td class="text-right" :colspan="colspan">Tiền lãi</td>
            <td class="text-right font-medium" :colspan="2">
              {{ invoice.status != InvoiceStatus.Refund ? formatMoney(invoice.profit) : 0 }}
            </td>
          </tr>
          <tr
            v-if="
              screenStore.SCREEN_INVOICE_DETAIL.paymentInfo.paid ||
              invoice.paid !== invoice.totalMoney
            "
          >
            <td
              v-if="[InvoiceStatus.Draft, InvoiceStatus.Prepayment].includes(invoice.status)"
              class="text-right cursor-pointer"
              :colspan="colspan"
              @click="showModalInvoicePayment(PaymentViewType.Prepayment)"
            >
              <span class="mr-1"> Đã tạm ứng </span>
              <ExclamationCircleOutlined />
            </td>
            <td
              v-else-if="[InvoiceStatus.Debt, InvoiceStatus.Success].includes(invoice.status)"
              class="text-right cursor-pointer"
              :colspan="colspan"
              @click="showModalInvoicePayment(PaymentViewType.PayDebt)"
            >
              <span class="mr-1"> Đã thanh toán </span>
              <ExclamationCircleOutlined />
            </td>
            <td
              v-else
              class="text-right cursor-pointer"
              :colspan="colspan"
              @click="showModalInvoicePayment(PaymentViewType.Success)"
            >
              <span class="mr-1"> Đã thanh toán </span>
              <ExclamationCircleOutlined />
            </td>
            <td class="text-right" :colspan="2">
              {{ formatMoney(invoice.paid) }}
            </td>
          </tr>
          <tr
            v-if="
              screenStore.SCREEN_INVOICE_DETAIL.paymentInfo.debt ||
              invoice.totalMoney - invoice.paid
            "
          >
            <template
              v-if="[InvoiceStatus.Draft, InvoiceStatus.Prepayment].includes(invoice.status)"
            >
              <td class="text-right" :colspan="colspan">Còn thiếu</td>
              <td class="text-right font-medium" :colspan="2">
                {{ formatMoney(invoice.totalMoney - invoice.paid) }}
              </td>
            </template>
            <template v-else>
              <td class="text-right" :colspan="colspan">Ghi nợ</td>
              <td class="text-right font-medium" :colspan="2">
                {{ formatMoney(invoice.debt) }}
              </td>
            </template>
          </tr>
        </tbody>
      </template>
      <tbody>
        <tr v-if="screenStore.SCREEN_INVOICE_DETAIL.paymentInfo.itemsActualMoney">
          <td class="text-right font-medium" :colspan="colspan">Tiền hàng</td>
          <td class="text-right font-medium" :colspan="2">
            {{ formatMoney(invoice.itemsActualMoney) }}
          </td>
        </tr>
        <tr v-if="screenStore.SCREEN_INVOICE_DETAIL.paymentInfo.discount || invoice.discountMoney">
          <td class="text-right" :colspan="colspan">Chiết khấu</td>
          <td class="text-right" :colspan="2">
            <a-tag v-if="invoice.discountType === '%'" color="success">
              {{ invoice.discountPercent || 0 }}%
            </a-tag>
            {{ formatMoney(invoice.discountMoney) }}
          </td>
        </tr>
        <tr v-if="screenStore.SCREEN_INVOICE_DETAIL.paymentInfo.surcharge || invoice.surcharge">
          <td class="text-right" :colspan="colspan">
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
          <td class="text-right" :colspan="2">
            {{ formatMoney(invoice.surcharge) }}
          </td>
        </tr>
        <tr>
          <td class="text-right font-medium" :colspan="colspan">Tổng tiền</td>
          <td class="text-right font-medium" :colspan="2">
            {{ formatMoney(invoice.totalMoney) }}
          </td>
        </tr>
        <tr v-if="screenStore.SCREEN_INVOICE_DETAIL.paymentInfo.profit">
          <td class="text-right" :colspan="colspan">Tiền lãi</td>
          <td class="text-right font-medium" :colspan="2">
            {{ invoice.status != InvoiceStatus.Refund ? formatMoney(invoice.profit) : 0 }}
          </td>
        </tr>
        <tr
          v-if="
            screenStore.SCREEN_INVOICE_DETAIL.paymentInfo.paid ||
            invoice.paid !== invoice.totalMoney
          "
        >
          <td
            v-if="[InvoiceStatus.Draft, InvoiceStatus.Prepayment].includes(invoice.status)"
            class="text-right cursor-pointer"
            :colspan="colspan"
            @click="showModalInvoicePayment(PaymentViewType.Prepayment)"
          >
            <a><span class="mr-1"> Đã tạm ứng </span> <ExclamationCircleOutlined /></a>
          </td>
          <td
            v-else-if="[InvoiceStatus.Debt, InvoiceStatus.Success].includes(invoice.status)"
            class="text-right cursor-pointer"
            :colspan="colspan"
            @click="showModalInvoicePayment(PaymentViewType.PayDebt)"
          >
            <a><span class="mr-1"> Đã thanh toán </span> <ExclamationCircleOutlined /></a>
          </td>
          <td
            v-else
            class="text-right cursor-pointer"
            :colspan="colspan"
            @click="showModalInvoicePayment(PaymentViewType.Success)"
          >
            <a><span class="mr-1"> Đã thanh toán </span> <ExclamationCircleOutlined /></a>
          </td>
          <td class="text-right" :colspan="2">
            {{ formatMoney(invoice.paid) }}
          </td>
        </tr>
        <tr
          v-if="
            screenStore.SCREEN_INVOICE_DETAIL.paymentInfo.debt || invoice.totalMoney - invoice.paid
          "
        >
          <template v-if="[InvoiceStatus.Draft, InvoiceStatus.Prepayment].includes(invoice.status)">
            <td class="text-right" :colspan="colspan">Còn thiếu</td>
            <td class="text-right font-medium" :colspan="2">
              {{ formatMoney(invoice.totalMoney - invoice.paid) }}
            </td>
          </template>
          <template v-else>
            <td class="text-right" :colspan="colspan">Ghi nợ</td>
            <td class="text-right font-medium" :colspan="2">
              {{ formatMoney(invoice.debt) }}
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped></style>
