<script setup lang="ts">
import VueTag from '@/common/VueTag.vue'
import { IconBug, IconExclamationCircle, IconFileSearch } from '@/common/icon-antd'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import { PaymentViewType } from '@/modules/enum'
import type { Warehouse } from '@/modules/warehouse'
import { WarehouseService } from '@/modules/warehouse/warehouse.service'
import { timeToText } from '@/utils'
import ModalProductDetail from '@/views/product/detail/ModalProductDetail.vue'
import { computed, onMounted, ref } from 'vue'
import { purchaseOrder } from './purchase-order-detail.ref'
import { VueTooltip } from '@/common/popover'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const emit = defineEmits<{ (e: 'showPurchaseOrderPayment', value: PaymentViewType): void }>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const warehouseMap = ref<Record<string, Warehouse>>({})

const showModalPurchaseOrderPayment = (paymentView: PaymentViewType) => {
  emit('showPurchaseOrderPayment', paymentView)
}

onMounted(async () => {
  warehouseMap.value = await WarehouseService.getMap()
})

const colspan = computed(() => {
  return (
    3 +
    Number(settingStore.SCREEN_PURCHASE_ORDER_DETAIL.purchaseOrderItemsTable.unit) +
    Number(settingStore.SCREEN_PURCHASE_ORDER_DETAIL.purchaseOrderItemsTable.warehouse) +
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
          <th v-if="CONFIG.MODE === 'development'"></th>
          <th>#</th>
          <th>Sản phẩm</th>
          <th v-if="settingStore.SCREEN_PURCHASE_ORDER_DETAIL.purchaseOrderItemsTable.warehouse">
            Kho
          </th>
          <th>SL</th>
          <th v-if="settingStore.SCREEN_PURCHASE_ORDER_DETAIL.purchaseOrderItemsTable.unit">ĐV</th>
          <th>G.Nhập</th>
          <th>T.Tiền</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(purchaseOrderItem, index) in purchaseOrder.purchaseOrderItemList || []"
          :key="index"
        >
          <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
            <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
              <template #trigger>
                <IconBug style="color: violet; cursor: pointer" width="1.2em" height="1.2em" />
              </template>
              <pre>{{ JSON.stringify(purchaseOrderItem, null, 4) }}</pre>
            </VueTooltip>
          </td>
          <td class="text-center">{{ index + 1 }}</td>
          <td>
            <div class="text-justify">
              <div style="font-weight: 500">
                {{ purchaseOrderItem!.product!.brandName }}
                <a
                  v-if="settingStore.SCREEN_PURCHASE_ORDER_DETAIL.purchaseOrderItemsTable.detail"
                  class="ml-1"
                  @click="modalProductDetail?.openModal(purchaseOrderItem.product!)"
                >
                  <IconFileSearch />
                </a>
              </div>
              <div
                v-if="settingStore.SCREEN_PURCHASE_ORDER_DETAIL.purchaseOrderItemsTable.substance"
                style="font-size: 0.8rem"
              >
                {{ purchaseOrderItem!.product!.substance }}
              </div>
              <div
                v-if="
                  settingStore.SCREEN_PURCHASE_ORDER_DETAIL.purchaseOrderItemsTable
                    .lotNumberAndExpiryDate
                "
                class="flex flex-wrap gap-2"
                style="font-size: 0.8rem"
              >
                <div v-if="purchaseOrderItem.lotNumber">S.Lô {{ purchaseOrderItem.lotNumber }}</div>
                <div v-if="purchaseOrderItem.expiryDate">
                  - HSD {{ timeToText(purchaseOrderItem.expiryDate) }}
                </div>
              </div>
            </div>
          </td>
          <td
            v-if="settingStore.SCREEN_PURCHASE_ORDER_DETAIL.purchaseOrderItemsTable.warehouse"
            class="text-center"
          >
            {{ warehouseMap[purchaseOrderItem.warehouseId]?.name }}
          </td>
          <td class="text-center">
            {{ purchaseOrderItem.unitQuantity }}
          </td>
          <td
            v-if="settingStore.SCREEN_PURCHASE_ORDER_DETAIL.purchaseOrderItemsTable.unit"
            class="text-center"
          >
            {{ purchaseOrderItem.unitName }}
          </td>
          <td class="text-right">
            {{ formatMoney(purchaseOrderItem.unitCostPrice) }}
          </td>
          <td class="text-right">
            {{ formatMoney(purchaseOrderItem.unitCostPrice * purchaseOrderItem.unitQuantity) }}
          </td>
        </tr>
        <tr v-if="settingStore.SCREEN_PURCHASE_ORDER_DETAIL.paymentInfo.itemsActualMoney">
          <td class="text-right font-bold" style="padding-right: 1rem" :colspan="colspan">
            Tiền hàng
          </td>
          <td colspan="2" class="text-right font-bold whitespace-nowrap">
            {{ formatMoney(purchaseOrder.itemsActualMoney) }}
          </td>
        </tr>
        <tr
          v-if="
            settingStore.SCREEN_PURCHASE_ORDER_DETAIL.paymentInfo.discount ||
            purchaseOrder.discountMoney
          "
        >
          <td class="text-right" style="padding-right: 1rem" :colspan="colspan">Chiết khấu</td>
          <td colspan="2" class="text-right whitespace-nowrap">
            <VueTag v-if="purchaseOrder.discountType === '%'" color="green">
              {{ purchaseOrder.discountPercent || 0 }}%
            </VueTag>
            {{ formatMoney(purchaseOrder.discountMoney) }}
          </td>
        </tr>
        <tr
          v-if="
            settingStore.SCREEN_PURCHASE_ORDER_DETAIL.paymentInfo.surcharge ||
            purchaseOrder.surcharge
          "
        >
          <td class="text-right" style="padding-right: 1rem" :colspan="colspan">Phụ phí</td>
          <td colspan="2" class="text-right whitespace-nowrap">
            {{ formatMoney(purchaseOrder.surcharge) }}
          </td>
        </tr>
        <tr>
          <td class="text-right font-bold" style="padding-right: 1rem" :colspan="colspan">
            Tổng tiền
          </td>
          <td colspan="2" class="text-right font-bold whitespace-nowrap">
            {{ formatMoney(purchaseOrder.totalMoney) }}
          </td>
        </tr>
        <tr>
          <td
            class="text-right cursor-pointer"
            :colspan="colspan"
            @click="showModalPurchaseOrderPayment(PaymentViewType.Success)"
          >
            <a>
              <span class="mr-1">Đã thanh toán</span>
              <IconExclamationCircle />
            </a>
          </td>
          <td colspan="2" class="text-right">
            {{ formatMoney(purchaseOrder.paid) }}
          </td>
        </tr>
        <tr v-if="purchaseOrder.debt" style="color: var(--text-red)">
          <td class="text-right" :colspan="colspan">Nợ</td>
          <td colspan="2" class="text-right font-bold">
            {{ formatMoney(purchaseOrder.debt) }}
          </td>
        </tr>
        <tr v-if="purchaseOrder.paid > purchaseOrder.totalMoney">
          <td class="text-right" :colspan="colspan" style="color: var(--text-green)">
            Thanh toán dư
          </td>
          <td colspan="2" class="text-right font-medium" style="color: var(--text-green)">
            {{ formatMoney(purchaseOrder.paid - purchaseOrder.totalMoney) }}
          </td>
        </tr>
        <tr v-else-if="purchaseOrder.debt !== purchaseOrder.totalMoney - purchaseOrder.paid">
          <td class="text-right" :colspan="colspan">Còn thiếu</td>
          <td colspan="2" class="text-right">
            {{ formatMoney(purchaseOrder.totalMoney - purchaseOrder.paid) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped></style>
