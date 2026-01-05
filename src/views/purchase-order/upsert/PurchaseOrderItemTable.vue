<script setup lang="ts">
import { IconFileSearch } from '@/common/icon-antd'
import { IconMinus, IconPlus, IconSortDown, IconSortUp } from '@/common/icon-font-awesome'
import { IconDelete, IconEditSquare } from '@/common/icon-google'
import { InputNumber } from '@/common/vue-form'
import { useSettingStore } from '@/modules/_me/setting.store'
import type { Warehouse } from '@/modules/warehouse'
import { WarehouseService } from '@/modules/warehouse/warehouse.service'
import { ESTimer } from '@/utils'
import ModalProductDetail from '@/views/product/detail/ModalProductDetail.vue'
import { onMounted, ref } from 'vue'
import ModalPurchaseOrderItemUpdate from './ModalPurchaseOrderItemUpdate.vue'
import { purchaseOrder } from './purchase-order-upsert.store'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalPurchaseOrderItemUpdate = ref<InstanceType<typeof ModalPurchaseOrderItemUpdate>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const warehouseMap = ref<Record<string, Warehouse>>({})
onMounted(async () => {
  warehouseMap.value = await WarehouseService.getMap()
})

const changeItemPosition = (index: number, count: number) => {
  const temp = purchaseOrder.value.purchaseOrderItemList![index]
  purchaseOrder.value.purchaseOrderItemList![index] =
    purchaseOrder.value.purchaseOrderItemList![index + count]
  purchaseOrder.value.purchaseOrderItemList![index + count] = temp
}

const handleChangePurchaseOrderItemUnitQuantity = (unitQuantity: number, index: number) => {
  purchaseOrder.value.purchaseOrderItemList![index].unitQuantity = unitQuantity
}

const startRemovePurchaseOrderItem = (_localId: string) => {
  const index = purchaseOrder.value.purchaseOrderItemList!.findIndex((i) => {
    return i._localId === _localId
  })
  purchaseOrder.value.purchaseOrderItemList!.splice(index, 1)
}
</script>

<template>
  <ModalProductDetail ref="modalProductDetail" />
  <ModalPurchaseOrderItemUpdate ref="modalPurchaseOrderItemUpdate" />
  <div v-if="isMobile" class="table-wrapper mt-2">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Sản phẩm</th>
          <th>SL</th>
          <th>G.Nhập</th>
          <th>TT</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="purchaseOrder.purchaseOrderItemList!.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr
          v-for="(purchaseOrderItem, index) in purchaseOrder.purchaseOrderItemList || []"
          :key="index"
        >
          <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
            <div class="flex flex-col items-center">
              <button
                type="button"
                style="
                  border: none;
                  font-size: 1.2rem;
                  line-height: 0.5;
                  background: none;
                  margin-bottom: -0.5rem;
                "
                class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                :disabled="index === 0"
                @click="changeItemPosition(index, -1)"
              >
                <IconSortUp style="opacity: 0.6" />
              </button>
              <span>{{ index + 1 }}</span>
              <button
                type="button"
                style="
                  border: none;
                  font-size: 1.2rem;
                  line-height: 0.5;
                  background: none;
                  margin-top: -0.5rem;
                "
                class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                :disabled="index === (purchaseOrder.purchaseOrderItemList?.length || 0) - 1"
                @click="changeItemPosition(index, 1)"
              >
                <IconSortDown style="opacity: 0.6" />
              </button>
            </div>
          </td>
          <td>
            <div class="font-medium">
              {{ purchaseOrderItem?.product?.brandName }}
              <a
                v-if="settingStore.SCREEN_PURCHASE_ORDER_UPSERT.purchaseOrderItemsTable.detail"
                class="ml-1"
                @click="modalProductDetail?.openModal(purchaseOrderItem?.product!)"
              >
                <IconFileSearch />
              </a>
            </div>
            <div
              v-if="settingStore.SCREEN_PURCHASE_ORDER_UPSERT.purchaseOrderItemsTable.substance"
              style="font-size: 0.8rem"
            >
              {{ purchaseOrderItem?.product?.substance }}
            </div>
            <div
              v-if="
                settingStore.SCREEN_PURCHASE_ORDER_UPSERT.purchaseOrderItemsTable
                  .lotNumberAndExpiryDate
              "
              style="font-size: 0.8rem"
            >
              <div v-if="purchaseOrderItem.lotNumber">S.Lô {{ purchaseOrderItem.lotNumber }}</div>
              <div v-if="purchaseOrderItem.expiryDate">
                - HSD {{ ESTimer.timeToText(purchaseOrderItem.expiryDate) }}
              </div>
            </div>
            <div
              v-if="settingStore.SCREEN_PURCHASE_ORDER_UPSERT.purchaseOrderItemsTable.warehouse"
              style="font-size: 0.8rem"
            >
              {{ warehouseMap[purchaseOrderItem.warehouseId]?.name }}
            </div>
          </td>
          <td style="width: 100px">
            <InputNumber
              v-model:value="purchaseOrderItem.unitQuantity"
              controlVertical
              :controlMinusDisable="purchaseOrderItem.unitQuantity === 0"
            />
          </td>
          <td class="text-right whitespace-nowrap">
            {{ formatMoney(purchaseOrderItem.unitCostPrice) }}
          </td>
          <td class="text-right whitespace-nowrap">
            {{ formatMoney(purchaseOrderItem.amount) }}
          </td>
          <td class="text-center">
            <a
              class="text-orange-500"
              style="font-size: 20px"
              @click="modalPurchaseOrderItemUpdate?.openModal(index)"
            >
              <IconEditSquare />
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-if="!isMobile" class="table-wrapper mt-2 pb-10">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Mã SP</th>
          <th>Tên Sản phẩm</th>
          <th v-if="settingStore.SCREEN_PURCHASE_ORDER_UPSERT.purchaseOrderItemsTable.warehouse">
            Nhập kho
          </th>
          <th style="min-width: 150px">S.Lượng</th>
          <th v-if="settingStore.SCREEN_PURCHASE_ORDER_UPSERT.purchaseOrderItemsTable.unit">
            Đ.Vị
          </th>
          <th>G.Nhập</th>
          <th>T.Tiền</th>
          <th colspan="2">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="purchaseOrder.purchaseOrderItemList!.length === 0">
          <td colspan="20" class="text-center">Chưa có dữ liệu</td>
        </tr>
        <tr v-for="(purchaseOrderItem, index) in purchaseOrder.purchaseOrderItemList" :key="index">
          <td>
            <div class="flex flex-col items-center">
              <button
                type="button"
                style="
                  border: none;
                  font-size: 1.2rem;
                  line-height: 0.5;
                  background: none;
                  margin-bottom: -0.5rem;
                "
                class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                :disabled="index === 0"
                @click="changeItemPosition(index, -1)"
              >
                <IconSortUp style="opacity: 0.6" />
              </button>
              <span>{{ index + 1 }}</span>
              <button
                type="button"
                style="
                  border: none;
                  font-size: 1.2rem;
                  line-height: 0.5;
                  background: none;
                  margin-top: -0.5rem;
                "
                class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                :disabled="index === (purchaseOrder.purchaseOrderItemList?.length || 0) - 1"
                @click="changeItemPosition(index, 1)"
              >
                <IconSortDown style="opacity: 0.6" />
              </button>
            </div>
          </td>
          <td style="text-align: center; width: 80px">
            {{ purchaseOrderItem.product?.productCode }}
          </td>
          <td style="min-width: 150px">
            <div>
              <div class="font-bold">
                {{ purchaseOrderItem?.product?.brandName }}
                <a
                  v-if="settingStore.SCREEN_PURCHASE_ORDER_UPSERT.purchaseOrderItemsTable.detail"
                  class="ml-1"
                  @click="modalProductDetail?.openModal(purchaseOrderItem?.product!)"
                >
                  <IconFileSearch />
                </a>
              </div>
              <div
                v-if="settingStore.SCREEN_PURCHASE_ORDER_UPSERT.purchaseOrderItemsTable.substance"
                style="font-size: 0.8rem"
              >
                {{ purchaseOrderItem?.product?.substance }}
              </div>
              <div
                v-if="
                  settingStore.SCREEN_PURCHASE_ORDER_UPSERT.purchaseOrderItemsTable
                    .lotNumberAndExpiryDate
                "
                style="font-size: 0.8rem"
              >
                <div v-if="purchaseOrderItem.lotNumber">S.Lô {{ purchaseOrderItem.lotNumber }}</div>
                <div v-if="purchaseOrderItem.expiryDate">
                  - HSD {{ ESTimer.timeToText(purchaseOrderItem.expiryDate) }}
                </div>
              </div>
            </div>
          </td>
          <td v-if="settingStore.SCREEN_PURCHASE_ORDER_UPSERT.purchaseOrderItemsTable.warehouse">
            {{ warehouseMap[purchaseOrderItem.warehouseId]?.name }}
          </td>
          <td style="width: 150px">
            <InputNumber
              v-model:value="purchaseOrderItem.unitQuantity"
              textAlign="right"
              controlHorizontal
              :controlMinusDisable="purchaseOrderItem.quantity === 0"
            />
          </td>
          <td
            v-if="settingStore.SCREEN_PURCHASE_ORDER_UPSERT.purchaseOrderItemsTable.unit"
            class="text-center"
          >
            {{ purchaseOrderItem.unitName }}
          </td>
          <td class="text-right">
            {{ formatMoney(purchaseOrderItem.unitCostPrice) }}
          </td>
          <td class="text-right">
            {{ formatMoney(purchaseOrderItem.amount) }}
          </td>
          <td class="text-center">
            <a
              class="text-orange-500"
              style="font-size: 20px"
              @click="modalPurchaseOrderItemUpdate?.openModal(index)"
            >
              <IconEditSquare />
            </a>
          </td>
          <td class="text-center">
            <a
              style="font-size: 22px; color: var(--text-red)"
              @click="startRemovePurchaseOrderItem(purchaseOrderItem._localId)"
            >
              <IconDelete />
            </a>
          </td>
        </tr>
        <tr>
          <td colspan="100" class="text-right">
            <span class="mr-10">Tổng tiền hàng:</span>
            <span class="mr-20">{{ formatMoney(purchaseOrder.itemsActualMoney) }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped></style>
