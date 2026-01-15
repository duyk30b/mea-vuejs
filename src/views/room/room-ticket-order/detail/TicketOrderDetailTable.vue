<script setup lang="ts">
import VueTag from '@/common/VueTag.vue'
import { IconBug, IconExclamationCircle, IconFileSearch } from '@/common/icon-antd'
import { VueTooltip } from '@/common/popover'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DeliveryStatus, PaymentViewType } from '@/modules/enum'
import { ExpenseService } from '@/modules/expense'
import { SurchargeService } from '@/modules/surcharge'
import ModalProcedureDetail from '@/views/master-data/procedure/detail/ModalProcedureDetail.vue'
import ModalProductDetail from '@/views/product/detail/ModalProductDetail.vue'
import TicketDeliveryStatusTooltip from '@/views/room/room-ticket-base/TicketDeliveryStatusTooltip.vue'
import { computed, onMounted, ref } from 'vue'
import { ticketOrderDetailRef } from './ticket-order-detail.ref'
import { BugDevelopment } from '@/views/component'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()

const surchargeMap = SurchargeService.surchargeMap
const expenseMap = ExpenseService.expenseMap

onMounted(async () => {
  await SurchargeService.getAll()
  await ExpenseService.getAll()
})

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const emit = defineEmits<{ (e: 'showInvoicePayment', value: PaymentViewType): void }>()

const showModalInvoicePayment = (paymentView: PaymentViewType) => {
  emit('showInvoicePayment', paymentView)
}

const colspan = computed(() => {
  if (isMobile) return 2
  return (
    4 +
    Number(settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit) +
    Number(settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount) +
    Number(settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.itemsCostAmount) +
    (CONFIG.MODE === 'development' ? 1 : 0)
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
          <tr
            v-for="(ticketProcedure, index) in ticketOrderDetailRef.ticketProcedureList || []"
            :key="index"
          >
            <td
              class="auto-index text-center whitespace-nowrap"
              style="padding: 0.5rem 0.2rem"
            ></td>
            <td>
              <div class="font-medium text-justify">
                {{ ticketProcedure.procedure!.name }}
                <a
                  v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.detail"
                  class="ml-1"
                  @click="modalProcedureDetail?.openModal(ticketProcedure.procedureId)"
                >
                  <IconFileSearch />
                </a>
              </div>
              <div class="" style="font-size: 0.8rem">
                <div
                  v-if="
                    ticketProcedure.discountMoney &&
                    settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.expectedPrice
                  "
                >
                  - NY:
                  <span class="font-medium">
                    {{ formatMoney(ticketProcedure.expectedPrice) }}
                  </span>
                </div>
                <div
                  v-if="
                    ticketProcedure.discountMoney &&
                    settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount
                  "
                >
                  - CK:
                  <VueTag v-if="ticketProcedure.discountType === 'VNĐ'" color="green">
                    {{ formatMoney(ticketProcedure.discountMoney) }}
                  </VueTag>
                  <VueTag v-if="ticketProcedure.discountType === '%'" color="green">
                    {{ ticketProcedure.discountPercent || 0 }}%
                  </VueTag>
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
          <tr
            v-for="(ticketProduct, index) in ticketOrderDetailRef.ticketProductList || []"
            :key="index"
          >
            <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
              {{ index + 1 }}
            </td>
            <td>
              <div class="font-medium text-justify">
                {{ ticketProduct.product!.brandName }}
                <a
                  v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.detail"
                  class="ml-1"
                  @click="modalProductDetail?.openModal(ticketProduct.product!)"
                >
                  <IconFileSearch />
                </a>
              </div>
              <div
                v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.substance"
                style="font-size: 0.8rem"
                class="max-line-2"
              >
                {{ ticketProduct.product!.substance }}
              </div>
              <div
                v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.hintUsage"
                style="font-size: 0.8rem"
              >
                {{ ticketProduct.hintUsage }}
              </div>
              <div class="" style="font-size: 0.8rem">
                <div
                  v-if="
                    ticketProduct.unitDiscountMoney &&
                    settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.expectedPrice
                  "
                >
                  - NY:
                  <span class="font-medium">
                    {{ formatMoney(ticketProduct.unitExpectedPrice) }}
                  </span>
                  <span
                    v-if="
                      settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit &&
                      ticketProduct.unitName
                    "
                  >
                    /{{ ticketProduct.unitName }}
                  </span>
                </div>
                <div
                  v-if="
                    ticketProduct.unitDiscountMoney &&
                    settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount
                  "
                >
                  - CK:
                  <VueTag v-if="ticketProduct.discountType === 'VNĐ'" color="green">
                    {{ formatMoney(ticketProduct.unitDiscountMoney) }}
                  </VueTag>
                  <VueTag v-if="ticketProduct.discountType === '%'" color="green">
                    {{ ticketProduct.discountPercent || 0 }}%
                  </VueTag>
                </div>
                <div>
                  - ĐG:
                  <span class="font-medium">
                    {{ formatMoney(ticketProduct.unitActualPrice) }}
                  </span>
                  <span
                    v-if="
                      settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit &&
                      ticketProduct.unitName
                    "
                  >
                    /{{ ticketProduct.unitName }}
                  </span>
                </div>
              </div>
            </td>
            <td class="text-center whitespace-nowrap">
              {{ ticketProduct.unitQuantity }}
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(ticketProduct.unitActualPrice) }}
            </td>
          </tr>
        </tbody>
      </template>
      <template v-if="!isMobile">
        <thead>
          <tr>
            <th style="width: 40px" v-if="CONFIG.MODE === 'development'"></th>
            <th style="width: 40px">#</th>
            <th style="width: 40px"></th>
            <th>Tên</th>
            <th v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit">Đ.Vị</th>
            <th>S.Lượng</th>
            <th v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount">C.Khấu</th>
            <th>Đ.Giá</th>
            <th v-if="settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.itemsCostAmount">T.Vốn</th>
            <th>T.Tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(ticketProcedure, index) in ticketOrderDetailRef.ticketProcedureList"
            :key="index"
          >
            <td v-if="CONFIG.MODE === 'development'" style="text-align: center">
              <BugDevelopment :data="ticketProcedure" />
            </td>
            <td class="text-center">{{ index + 1 }}</td>
            <td class="text-center"></td>
            <td :colspan="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit ? '2' : '1'">
              <div class="text-justify font-medium whitespace-nowrap" style="word-break: break-all">
                {{ ticketProcedure.procedure!.name }}
                <a
                  v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.detail"
                  class="ml-1"
                  @click="modalProcedureDetail?.openModal(ticketProcedure.procedureId)"
                >
                  <IconFileSearch />
                </a>
              </div>
            </td>
            <td class="text-center">{{ ticketProcedure.quantity }}</td>
            <td
              v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount"
              class="text-center"
            >
              <VueTag v-if="ticketProcedure.discountType === 'VNĐ'" color="green">
                {{ formatMoney(ticketProcedure.discountMoney) }}
              </VueTag>
              <VueTag v-if="ticketProcedure.discountType === '%'" color="green">
                {{ ticketProcedure.discountPercent || 0 }}%
              </VueTag>
            </td>
            <td class="text-right">
              <div
                v-if="
                  settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.expectedPrice &&
                  ticketProcedure.discountMoney
                "
                class="text-xs italic line-through"
                style="color: var(--text-red)"
              >
                {{ formatMoney(ticketProcedure.expectedPrice) }}
              </div>
              <div>{{ formatMoney(ticketProcedure.actualPrice) }}</div>
            </td>
            <td v-if="settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.itemsCostAmount"></td>
            <td class="text-right">
              {{ formatMoney(ticketProcedure.actualPrice * ticketProcedure.quantity) }}
            </td>
          </tr>
          <tr v-for="(ticketProduct, index) in ticketOrderDetailRef.ticketProductList" :key="index">
            <td v-if="CONFIG.MODE === 'development'" style="text-align: center">
              <BugDevelopment :data="ticketProduct" />
            </td>
            <td class="text-center">{{ index + 1 }}</td>
            <td class="text-center">
              <TicketDeliveryStatusTooltip :deliveryStatus="ticketProduct.deliveryStatus" />
            </td>
            <td>
              <div class="text-justify font-medium">
                {{ ticketProduct.product!.brandName }}
                <a
                  v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.detail"
                  class="ml-1"
                  @click="modalProductDetail?.openModal(ticketProduct.product!)"
                >
                  <IconFileSearch />
                </a>
              </div>
              <div
                v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.substance"
                class="max-line-2"
                style="font-size: 0.8rem"
              >
                {{ ticketProduct.product!.substance }}
              </div>
              <div
                v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.hintUsage"
                style="font-size: 0.8rem"
              >
                {{ ticketProduct.hintUsage }}
              </div>
            </td>
            <td
              v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit"
              class="text-center"
            >
              {{ ticketProduct.unitName }}
            </td>
            <td class="text-center">
              <div>{{ ticketProduct.unitQuantity }}</div>
            </td>
            <td
              v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount"
              class="text-center"
            >
              <VueTag v-if="ticketProduct.discountType === 'VNĐ'" color="green">
                {{ formatMoney(ticketProduct.unitDiscountMoney) }}
              </VueTag>
              <VueTag v-if="ticketProduct.discountType === '%'" color="green">
                {{ ticketProduct.discountPercent || 0 }}%
              </VueTag>
            </td>
            <td class="text-right">
              <div
                v-if="
                  settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.expectedPrice &&
                  ticketProduct.unitDiscountMoney
                "
                class="text-xs italic line-through"
                style="color: var(--text-red)"
              >
                {{ formatMoney(ticketProduct.unitExpectedPrice) }}
              </div>
              <div>{{ formatMoney(ticketProduct.unitActualPrice) }}</div>
            </td>
            <td
              v-if="settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.itemsCostAmount"
              class="text-right"
            >
              <span v-if="ticketOrderDetailRef.deliveryStatus === DeliveryStatus.Pending">
                {{
                  formatMoney(
                    ticketProduct.unitQuantity *
                      ticketProduct.unitRate *
                      ticketProduct.product!.costPrice,
                  )
                }}
              </span>
              <span v-else>
                {{ formatMoney(ticketProduct.costAmount) }}
              </span>
            </td>
            <td class="text-right">
              {{ formatMoney(ticketProduct.unitActualPrice * ticketProduct.unitQuantity) }}
            </td>
          </tr>
        </tbody>
      </template>
      <tbody>
        <tr v-if="settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.itemsActualMoney">
          <td class="text-right font-medium" :colspan="colspan">Tiền hàng</td>
          <td class="text-right" :colspan="2">
            <span
              v-if="ticketOrderDetailRef.itemsDiscount"
              style="font-style: italic; font-size: 13px"
              class="mr-2"
            >
              (CK: {{ formatMoney(ticketOrderDetailRef.itemsDiscount) }})
            </span>
            <span class="font-medium">
              {{ formatMoney(ticketOrderDetailRef.itemsActualMoney) }}
            </span>
          </td>
        </tr>
        <tr
          v-if="
            settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.discount ||
            ticketOrderDetailRef.discountMoney
          "
        >
          <td class="text-right" :colspan="colspan">Chiết khấu</td>
          <td class="text-right" :colspan="2">
            <VueTag color="green">{{ ticketOrderDetailRef.discountPercent || 0 }}%</VueTag>
            <span class="ml-2">
              {{ formatMoney(ticketOrderDetailRef.discountMoney) }}
            </span>
          </td>
        </tr>
        <tr
          v-if="
            settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.surcharge ||
            ticketOrderDetailRef.surcharge
          "
        >
          <td class="text-right" :colspan="colspan">
            Phụ phí
            <span v-if="(ticketOrderDetailRef.ticketSurchargeList || []).length" class="ml-1">
              ({{
                ticketOrderDetailRef
                  .ticketSurchargeList!.map(
                    (i) => `${surchargeMap[i.surchargeId]?.name}: ${formatMoney(i.money)}`,
                  )
                  .join(' - ')
              }})
            </span>
          </td>
          <td class="text-right" :colspan="2">
            {{ formatMoney(ticketOrderDetailRef.surcharge) }}
          </td>
        </tr>
        <tr>
          <td class="text-right font-medium" :colspan="colspan">Tổng tiền</td>
          <td class="text-right font-medium" :colspan="2">
            {{ formatMoney(ticketOrderDetailRef.totalMoney) }}
          </td>
        </tr>
        <tr v-if="settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.itemsCostAmount">
          <template v-if="ticketOrderDetailRef.deliveryStatus === DeliveryStatus.Pending">
            <td class="text-right" :colspan="colspan">Dự kiến vốn</td>
            <td class="text-right" :colspan="2">
              {{ formatMoney(ticketOrderDetailRef.itemsCostAmountExpected) }}
            </td>
          </template>
          <template v-else>
            <td class="text-right" :colspan="colspan">Tiền vốn</td>
            <td class="text-right" :colspan="2">
              {{ formatMoney(ticketOrderDetailRef.itemsCostAmount) }}
            </td>
          </template>
        </tr>
        <tr v-if="settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.expense">
          <td class="text-right" :colspan="colspan">
            Chi phí
            <span v-if="(ticketOrderDetailRef.ticketExpenseList || []).length" class="ml-1">
              ({{
                ticketOrderDetailRef
                  .ticketExpenseList!.map(
                    (i) => `${expenseMap[i.expenseId]?.name}: ${formatMoney(i.money)}`,
                  )
                  .join(' - ')
              }})
            </span>
          </td>
          <td class="text-right" :colspan="2">
            {{ formatMoney(ticketOrderDetailRef.expense) }}
          </td>
        </tr>
        <tr v-if="settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.profit">
          <template v-if="ticketOrderDetailRef.deliveryStatus === DeliveryStatus.Pending">
            <td class="text-right" :colspan="colspan">Dự kiến lãi</td>
            <td class="text-right font-medium" :colspan="2">
              {{ formatMoney(ticketOrderDetailRef.profitExpected) }}
            </td>
          </template>
          <template v-else>
            <td class="text-right" :colspan="colspan">Tiền lãi</td>
            <td class="text-right font-medium" :colspan="2">
              {{ formatMoney(ticketOrderDetailRef.profit) }}
            </td>
          </template>
        </tr>
        <tr>
          <td
            class="text-right cursor-pointer"
            :colspan="colspan"
            @click="showModalInvoicePayment(PaymentViewType.Success)"
          >
            <a>
              <span class="mr-1">Đã thanh toán</span>
              <IconExclamationCircle />
            </a>
          </td>

          <td class="text-right" :colspan="2">
            {{ formatMoney(ticketOrderDetailRef.paidTotal) }}
          </td>
        </tr>
        <tr v-if="ticketOrderDetailRef.debtTotal" style="color: var(--text-red)">
          <td class="text-right" :colspan="colspan">Nợ</td>
          <td colspan="2" class="text-right font-bold">
            {{ formatMoney(ticketOrderDetailRef.debtTotal) }}
          </td>
        </tr>
        <tr v-if="ticketOrderDetailRef.paidTotal > ticketOrderDetailRef.totalMoney">
          <td class="text-right" :colspan="colspan" style="color: var(--text-green)">Đang thừa</td>
          <td colspan="2" class="text-right font-medium" style="color: var(--text-green)">
            {{ formatMoney(ticketOrderDetailRef.paidTotal - ticketOrderDetailRef.totalMoney) }}
          </td>
        </tr>
        <tr
          v-else-if="
            ticketOrderDetailRef.debtTotal !==
            ticketOrderDetailRef.totalMoney - ticketOrderDetailRef.paidTotal
          "
        >
          <td class="text-right" :colspan="colspan">Còn thiếu</td>
          <td colspan="2" class="text-right">
            {{ formatMoney(ticketOrderDetailRef.totalMoney - ticketOrderDetailRef.paidTotal) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped></style>
