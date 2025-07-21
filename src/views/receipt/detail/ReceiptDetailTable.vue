<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import VueTag from '../../../common/VueTag.vue'
import { IconExclamationCircle, IconFileSearch } from '../../../common/icon-antd'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { PaymentViewType } from '../../../modules/enum'
import { ReceiptStatus } from '../../../modules/receipt'
import type { Warehouse } from '../../../modules/warehouse'
import { WarehouseService } from '../../../modules/warehouse/warehouse.service'
import { timeToText } from '../../../utils'
import ModalProductDetail from '../../../views/product/detail/ModalProductDetail.vue'
import { receipt } from './receipt-detail.ref'
import { CONFIG } from '../../../config'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const emit = defineEmits<{ (e: 'showReceiptPayment', value: PaymentViewType): void }>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const warehouseMap = ref<Record<string, Warehouse>>({})

const showModalReceiptPayment = (paymentView: PaymentViewType) => {
  emit('showReceiptPayment', paymentView)
}

onMounted(async () => {
  warehouseMap.value = await WarehouseService.getMap()
})

const colspan = computed(() => {
  return (
    3 +
    Number(settingStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.unit) +
    Number(settingStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.warehouse) +
    (CONFIG.MODE === 'development' ? 1 : 0)
  )
})
</script>

<template>
  <ModalProductDetail ref="modalProductDetail" />
  <div class="mt-2 table-wrapper" :class="!isMobile ? 'px-4 w-full' : ''">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th v-if="CONFIG.MODE === 'development'">ID</th>
          <th>Sản phẩm</th>
          <th v-if="settingStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.warehouse">Kho</th>
          <th>SL</th>
          <th v-if="settingStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.unit">ĐV</th>
          <th>G.Nhập</th>
          <th>T.Tiền</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(receiptItem, index) in receipt.receiptItemList || []" :key="index">
          <td class="text-center">{{ index + 1 }}</td>
          <td v-if="CONFIG.MODE === 'development'" style="text-align: center; color: violet">
            {{ receiptItem.id }}
          </td>
          <td>
            <div class="text-justify">
              <div style="font-weight: 500">
                {{ receiptItem!.product!.brandName }}
                <a
                  v-if="settingStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.detail"
                  class="ml-1"
                  @click="modalProductDetail?.openModal(receiptItem.product!)"
                >
                  <IconFileSearch />
                </a>
              </div>
              <div
                v-if="settingStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.substance"
                style="font-size: 0.8rem"
              >
                {{ receiptItem!.product!.substance }}
              </div>
              <div
                v-if="settingStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.lotNumberAndExpiryDate"
                class="flex flex-wrap gap-2"
                style="font-size: 0.8rem"
              >
                <div v-if="receiptItem.lotNumber">S.Lô {{ receiptItem.lotNumber }}</div>
                <div v-if="receiptItem.expiryDate">
                  - HSD {{ timeToText(receiptItem.expiryDate) }}
                </div>
              </div>
            </div>
          </td>
          <td
            v-if="settingStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.warehouse"
            class="text-center"
          >
            {{ warehouseMap[receiptItem.warehouseId]?.name }}
          </td>
          <td class="text-center">
            {{ receiptItem.unitQuantity }}
          </td>
          <td v-if="settingStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.unit" class="text-center">
            {{ receiptItem.unitName }}
          </td>
          <td class="text-right">
            {{ formatMoney(receiptItem.unitCostPrice) }}
          </td>
          <td class="text-right">
            {{ formatMoney(receiptItem.amount) }}
          </td>
        </tr>
        <tr v-if="settingStore.SCREEN_RECEIPT_DETAIL.paymentInfo.itemsActualMoney">
          <td class="text-right font-bold" style="padding-right: 1rem" :colspan="colspan">
            Tiền hàng
          </td>
          <td colspan="2" class="text-right font-bold whitespace-nowrap">
            {{ formatMoney(receipt.itemsActualMoney) }}
          </td>
        </tr>
        <tr v-if="settingStore.SCREEN_RECEIPT_DETAIL.paymentInfo.discount || receipt.discountMoney">
          <td class="text-right" style="padding-right: 1rem" :colspan="colspan">Chiết khấu</td>
          <td colspan="2" class="text-right whitespace-nowrap">
            <VueTag v-if="receipt.discountType === '%'" color="green">
              {{ receipt.discountPercent || 0 }}%
            </VueTag>
            {{ formatMoney(receipt.discountMoney) }}
          </td>
        </tr>
        <tr v-if="settingStore.SCREEN_RECEIPT_DETAIL.paymentInfo.surcharge || receipt.surcharge">
          <td class="text-right" style="padding-right: 1rem" :colspan="colspan">Phụ phí</td>
          <td colspan="2" class="text-right whitespace-nowrap">
            {{ formatMoney(receipt.surcharge) }}
          </td>
        </tr>
        <tr>
          <td class="text-right font-bold" style="padding-right: 1rem" :colspan="colspan">
            Tổng tiền
          </td>
          <td colspan="2" class="text-right font-bold whitespace-nowrap">
            {{ formatMoney(receipt.totalMoney) }}
          </td>
        </tr>
        <tr
          v-if="
            settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.paid ||
            receipt.paid !== receipt.totalMoney
          "
        >
          <td
            class="text-right cursor-pointer"
            :colspan="colspan"
            @click="showModalReceiptPayment(PaymentViewType.Success)"
          >
            <a>
              <span class="mr-1">Đã thanh toán</span>
              <IconExclamationCircle />
            </a>
          </td>
          <td colspan="2" class="text-right">
            {{ formatMoney(receipt.paid) }}
          </td>
        </tr>
        <tr v-if="settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.debt || receipt.debt">
          <template v-if="receipt.debt >= 0">
            <td class="text-right" :colspan="colspan">Còn thiếu</td>
            <td colspan="2" class="text-right">{{ formatMoney(receipt.debt) }}</td>
          </template>
          <template v-if="receipt.debt < 0">
            <td class="text-right" :colspan="colspan" style="color: var(--text-green)">
              <span>Thanh toán dư</span>
            </td>
            <td colspan="2" class="text-right font-medium" style="color: var(--text-green)">
              {{ formatMoney(-receipt.debt) }}
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped></style>
