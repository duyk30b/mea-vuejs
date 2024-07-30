<script setup lang="ts">
import { ExclamationCircleOutlined, FileSearchOutlined } from '@ant-design/icons-vue'
import { computed, ref } from 'vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { TicketStatus } from '../../../modules/ticket'
import { timeToText } from '../../../utils'
import ModalProcedureDetail from '../../../views/master-data/procedure/detail/ModalProcedureDetail.vue'
import ModalProductDetail from '../../../views/product/detail/ModalProductDetail.vue'
import { PaymentViewType, ticket } from './ticket-order-detail.ref'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const emit = defineEmits<{ (e: 'showInvoicePayment', value: PaymentViewType): void }>()

const showModalInvoicePayment = (paymentView: PaymentViewType) => {
  emit('showInvoicePayment', paymentView)
}
const colspan = computed(() => {
  if (isMobile) return 2
  return (
    3 +
    Number(settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit) +
    Number(settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount)
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
          <tr v-for="(ticketProcedure, index) in ticket.ticketProcedureList || []" :key="index">
            <td
              class="auto-index text-center whitespace-nowrap"
              style="padding: 0.5rem 0.2rem"></td>
            <td>
              <div class="font-medium text-justify">
                {{ ticketProcedure.procedure!.name }}
                <a
                  v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.detail"
                  class="ml-1"
                  @click="modalProcedureDetail?.openModal(ticketProcedure.procedure!)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div class="flex gap-2" style="font-size: 0.8rem">
                <div v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.expectedPrice">
                  NY:
                  <span class="font-medium">
                    {{ formatMoney(ticketProcedure.expectedPrice) }}
                  </span>
                </div>
                <div
                  v-if="
                    ticketProcedure.discountMoney &&
                    settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount
                  ">
                  - CK:
                  <span v-if="ticketProcedure.discountType === 'VNĐ'" class="font-medium">
                    {{ formatMoney(ticketProcedure.discountMoney) }}
                  </span>
                  <span v-if="ticketProcedure.discountType === '%'" class="font-medium">
                    {{ ticketProcedure.discountPercent || 0 }}%
                  </span>
                </div>
                <div>
                  - ĐG:
                  <span class="font-medium">
                    {{ formatMoney(ticketProcedure.actualPrice) }}
                  </span>
                </div>
              </div>
            </td>
            <td class="text-center whitespace-nowrap">
              {{ ticketProcedure.quantity }}
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(ticketProcedure.actualPrice * ticketProcedure.quantity) }}
            </td>
          </tr>
          <tr v-for="(ticketProduct, index) in ticket.ticketProductList || []" :key="index">
            <td
              class="auto-index text-center whitespace-nowrap"
              style="padding: 0.5rem 0.2rem"></td>
            <td>
              <div class="font-medium text-justify">
                {{ ticketProduct.product!.brandName }}
                <a
                  v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.detail"
                  class="ml-1"
                  @click="modalProductDetail?.openModal(ticketProduct.product!)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div
                v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.substance"
                style="font-size: 0.8rem"
                class="text-justify">
                {{ ticketProduct.product!.substance }}
              </div>
              <div
                v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.lotNumberAndExpiryDate"
                class="flex gap-2 flex-wrap"
                style="font-size: 0.8rem">
                <div v-if="ticketProduct.lotNumber">S.Lô {{ ticketProduct.lotNumber }}</div>
                <div v-if="ticketProduct.expiryDate">
                  - HSD {{ timeToText(ticketProduct.expiryDate) }}
                </div>
              </div>
              <div
                v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.hintUsage"
                style="font-size: 0.8rem">
                {{ ticketProduct.hintUsage }}
              </div>
              <div class="flex gap-2" style="font-size: 0.8rem">
                <div v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.expectedPrice">
                  NY:
                  <span class="font-medium">
                    {{ formatMoney(ticketProduct.expectedPrice * ticketProduct.unitRate) }}
                  </span>
                  <span
                    v-if="
                      settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit &&
                      ticketProduct.unitName
                    ">
                    /{{ ticketProduct.unitName }}
                  </span>
                </div>
                <div
                  v-if="
                    ticketProduct.discountMoney &&
                    settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount
                  ">
                  - CK:
                  <span v-if="ticketProduct.discountType === 'VNĐ'" class="font-medium">
                    {{ formatMoney(ticketProduct.discountMoney * ticketProduct.unitRate) }}
                  </span>
                  <span v-if="ticketProduct.discountType === '%'" class="font-medium">
                    {{ ticketProduct.discountPercent || 0 }}%
                  </span>
                </div>
                <div>
                  - ĐG:
                  <span class="font-medium">
                    {{ formatMoney(ticketProduct.actualPrice * ticketProduct.unitRate) }}
                  </span>
                  <span
                    v-if="
                      settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit &&
                      ticketProduct.unitName
                    ">
                    /{{ ticketProduct.unitName }}
                  </span>
                </div>
              </div>
            </td>
            <td class="text-center whitespace-nowrap">
              {{ ticketProduct.quantity / ticketProduct.unitRate }}
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(ticketProduct.actualPrice * ticketProduct.quantity) }}
            </td>
          </tr>
        </tbody>
      </template>
      <template v-if="!isMobile">
        <thead>
          <tr>
            <th>#</th>
            <th>Tên</th>
            <th v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit">Đ.Vị</th>
            <th>S.Lượng</th>
            <th v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount">C.Khấu</th>
            <th>Đ.Giá</th>
            <th>T.Tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ticketProcedure, index) in ticket.ticketProcedureList" :key="index">
            <td class="auto-index text-center"></td>
            <td :colspan="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit ? '2' : '1'">
              <div class="text-justify font-medium whitespace-nowrap" style="word-break: break-all">
                {{ ticketProcedure.procedure!.name }}
                <a
                  v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.detail"
                  class="ml-1"
                  @click="modalProcedureDetail?.openModal(ticketProcedure.procedure!)">
                  <FileSearchOutlined />
                </a>
              </div>
            </td>
            <td class="text-center">{{ ticketProcedure.quantity }}</td>
            <td
              v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount"
              class="text-center">
              <a-tag
                v-if="ticketProcedure.discountType === 'VNĐ'"
                color="success"
                style="cursor: pointer">
                {{ formatMoney(ticketProcedure.discountMoney) }}
              </a-tag>
              <a-tag
                v-if="ticketProcedure.discountType === '%'"
                color="success"
                style="cursor: pointer">
                {{ ticketProcedure.discountPercent || 0 }}%
              </a-tag>
            </td>
            <td class="text-right">
              <div
                v-if="
                  settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.expectedPrice &&
                  ticketProcedure.discountMoney
                "
                class="text-xs italic line-through"
                style="color: var(--text-red)">
                {{ formatMoney(ticketProcedure.expectedPrice) }}
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
              <div class="text-justify font-medium">
                {{ ticketProduct.product!.brandName }}
                <a
                  v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.detail"
                  class="ml-1"
                  @click="modalProductDetail?.openModal(ticketProduct.product!)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div
                v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.substance"
                style="font-size: 0.8rem">
                {{ ticketProduct.product!.substance }}
              </div>
              <div
                v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.lotNumberAndExpiryDate"
                style="font-size: 0.8rem"
                class="flex gap-2">
                <div v-if="ticketProduct.lotNumber">S.Lô {{ ticketProduct.lotNumber }}</div>
                <div v-if="ticketProduct.expiryDate">
                  - HSD {{ timeToText(ticketProduct.expiryDate) }}
                </div>
              </div>
              <div
                v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.hintUsage"
                style="font-size: 0.8rem">
                {{ ticketProduct.hintUsage }}
              </div>
            </td>
            <td
              v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit"
              class="text-center">
              {{ ticketProduct.unitName }}
            </td>
            <td class="text-center">
              <div>{{ ticketProduct.unitQuantity }}</div>
            </td>
            <td
              v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount"
              class="text-center">
              <a-tag
                v-if="ticketProduct.discountType === 'VNĐ'"
                color="success"
                style="cursor: pointer">
                {{ formatMoney(ticketProduct.discountMoney * ticketProduct.unitRate) }}
              </a-tag>
              <a-tag
                v-if="ticketProduct.discountType === '%'"
                color="success"
                style="cursor: pointer">
                {{ ticketProduct.discountPercent || 0 }}%
              </a-tag>
            </td>
            <td class="text-right">
              <div
                v-if="
                  settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.expectedPrice &&
                  ticketProduct.discountMoney
                "
                class="text-xs italic line-through"
                style="color: var(--text-red)">
                {{ formatMoney(ticketProduct.expectedPrice * ticketProduct.unitRate) }}
              </div>
              <div>{{ formatMoney(ticketProduct.actualPrice * ticketProduct.unitRate) }}</div>
            </td>
            <td class="text-right">
              {{ formatMoney(ticketProduct.actualPrice * ticketProduct.quantity) }}
            </td>
          </tr>
        </tbody>
      </template>
      <tbody>
        <tr v-if="settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.itemsActualMoney">
          <td class="text-right font-medium" :colspan="colspan">Tiền hàng</td>
          <td class="text-right" :colspan="2">
            <span v-if="ticket.itemsDiscount" style="font-style: italic; font-size: 13px" class="mr-2">
              (CK: {{ formatMoney(ticket.itemsDiscount) }})
            </span>
            <span class="font-medium">
              {{ formatMoney(ticket.itemsActualMoney) }}
            </span>
          </td>
        </tr>
        <tr v-if="settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.discount || ticket.discountMoney">
          <td class="text-right" :colspan="colspan">Chiết khấu</td>
          <td class="text-right" :colspan="2">
            <a-tag color="success">{{ ticket.discountPercent || 0 }}%</a-tag>
            <span class="ml-2">
              {{ formatMoney(ticket.discountMoney) }}
            </span>
          </td>
        </tr>
        <tr v-if="settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.surcharge || ticket.surcharge">
          <td class="text-right" :colspan="colspan">
            Phụ phí
            <span
              v-if="
                (ticket.ticketSurchargeList || []).length > 1 ||
                ((ticket.ticketSurchargeList || []).length == 1 &&
                  ticket.ticketSurchargeList![0].key !== '_unknown')
              "
              class="ml-1">
              ({{
                ticket
                  .ticketSurchargeList!.map((i) => `${i.name}: ${formatMoney(i.money)}`)
                  .join(' - ')
              }})
            </span>
          </td>
          <td class="text-right" :colspan="2">
            {{ formatMoney(ticket.surcharge) }}
          </td>
        </tr>
        <tr>
          <td class="text-right font-medium" :colspan="colspan">Tổng tiền</td>
          <td class="text-right font-medium" :colspan="2">
            {{ formatMoney(ticket.totalMoney) }}
          </td>
        </tr>
        <tr v-if="settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.totalCostAmount">
          <td class="text-right" :colspan="colspan">Tiền vốn</td>
          <td class="text-right" :colspan="2">
            {{ formatMoney(ticket.totalCostAmount) }}
          </td>
        </tr>
        <tr v-if="settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.expense">
          <td class="text-right" :colspan="colspan">
            Chi phí
            <span
              v-if="
                (ticket.ticketExpenseList || []).length > 1 ||
                ((ticket.ticketExpenseList || []).length == 1 &&
                  ticket.ticketExpenseList![0].key !== '_unknown')
              "
              class="ml-1">
              ({{
                ticket
                  .ticketExpenseList!.map((i) => `${i.name}: ${formatMoney(i.money)}`)
                  .join(' - ')
              }})
            </span>
          </td>
          <td class="text-right" :colspan="2">
            {{ formatMoney(ticket.expense) }}
          </td>
        </tr>
        <tr v-if="settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.profit">
          <td class="text-right" :colspan="colspan">Tiền lãi</td>
          <td class="text-right font-medium" :colspan="2">
            {{ formatMoney(ticket.profit) }}
          </td>
        </tr>
        <tr
          v-if="
            settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.paid || ticket.paid !== ticket.totalMoney
          ">
          <td
            v-if="
              [TicketStatus.Draft, TicketStatus.Approved, TicketStatus.Executing].includes(
                ticket.ticketStatus
              )
            "
            class="text-right cursor-pointer"
            :colspan="colspan"
            @click="showModalInvoicePayment(PaymentViewType.Prepayment)">
            <a>
              <span class="mr-1">Đã tạm ứng</span>
              <ExclamationCircleOutlined />
            </a>
          </td>
          <td
            v-else-if="[TicketStatus.Debt].includes(ticket.ticketStatus)"
            class="text-right cursor-pointer"
            :colspan="colspan"
            @click="showModalInvoicePayment(PaymentViewType.PayDebt)">
            <a>
              <span class="mr-1">Đã thanh toán</span>
              <ExclamationCircleOutlined />
            </a>
          </td>
          <td
            v-else
            class="text-right cursor-pointer"
            :colspan="colspan"
            @click="showModalInvoicePayment(PaymentViewType.Success)">
            <a>
              <span class="mr-1">Đã thanh toán</span>
              <ExclamationCircleOutlined />
            </a>
          </td>
          <td class="text-right" :colspan="2">
            {{ formatMoney(ticket.paid) }}
          </td>
        </tr>
        <tr
          v-if="
            settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.debt || ticket.totalMoney - ticket.paid
          ">
          <template
            v-if="[TicketStatus.Draft, TicketStatus.Approved].includes(ticket.ticketStatus)">
            <td v-if="ticket.paid <= ticket.totalMoney" class="text-right" :colspan="colspan">
              Còn thiếu
            </td>
            <td v-else class="text-right" :colspan="colspan">Thừa</td>
            <td class="text-right font-medium" :colspan="2">
              {{ formatMoney(Math.abs(ticket.totalMoney - ticket.paid)) }}
            </td>
          </template>
          <template v-else>
            <td class="text-right" :colspan="colspan">Ghi nợ</td>
            <td class="text-right font-medium" :colspan="2">
              {{ formatMoney(ticket.debt) }}
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped></style>
