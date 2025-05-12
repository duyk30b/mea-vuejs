<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { IconFileSearch } from '../../../common/icon'
import { IconSortDown, IconSortUp } from '../../../common/icon-font-awesome'
import { IconEditSquare } from '../../../common/icon-google'
import { useSettingStore } from '../../../modules/_me/setting.store'
import type { Warehouse } from '../../../modules/warehouse'
import { WarehouseService } from '../../../modules/warehouse/warehouse.service'
import { timeToText } from '../../../utils'
import ModalProductDetail from '../../product/detail/ModalProductDetail.vue'
import ModalReceiptItemUpdate from './ModalReceiptItemUpdate.vue'
import { receipt } from './receipt-upsert.store'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalReceiptItemUpdate = ref<InstanceType<typeof ModalReceiptItemUpdate>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const warehouseMap = ref<Record<string, Warehouse>>({})
onMounted(async () => {
  warehouseMap.value = await WarehouseService.getMap()
})

const changeItemPosition = (index: number, count: number) => {
  const temp = receipt.value.receiptItemList![index]
  receipt.value.receiptItemList![index] = receipt.value.receiptItemList![index + count]
  receipt.value.receiptItemList![index + count] = temp
}
</script>

<template>
  <ModalProductDetail ref="modalProductDetail" />
  <ModalReceiptItemUpdate ref="modalReceiptItemUpdate" />
  <div>Giỏ hàng ({{ receipt.receiptItemList?.length || 0 }})</div>
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
        <tr v-if="receipt.receiptItemList!.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="(receiptItem, index) in receipt.receiptItemList || []" :key="index">
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
                :disabled="index === (receipt.receiptItemList?.length || 0) - 1"
                @click="changeItemPosition(index, 1)"
              >
                <IconSortDown style="opacity: 0.6" />
              </button>
            </div>
          </td>
          <td>
            <div class="font-medium">
              {{ receiptItem?.product?.brandName }}
              <a
                v-if="settingStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.detail"
                class="ml-1"
                @click="modalProductDetail?.openModal(receiptItem?.product!)"
              >
                <IconFileSearch />
              </a>
            </div>
            <div
              v-if="settingStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.substance"
              style="font-size: 0.8rem"
            >
              {{ receiptItem?.product?.substance }}
            </div>
            <div
              v-if="settingStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.lotNumberAndExpiryDate"
              style="font-size: 0.8rem"
            >
              <div v-if="receiptItem.lotNumber">S.Lô {{ receiptItem.lotNumber }}</div>
              <div v-if="receiptItem.expiryDate">
                - HSD {{ timeToText(receiptItem.expiryDate) }}
              </div>
            </div>
            <div
              v-if="settingStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.warehouse"
              style="font-size: 0.8rem"
            >
              {{ warehouseMap[receiptItem.warehouseId]?.name }}
            </div>
          </td>
          <td class="text-center whitespace-nowrap">
            {{ receiptItem.unitQuantity }}
          </td>
          <td class="text-right whitespace-nowrap">
            {{ formatMoney(receiptItem.unitCostPrice) }}
          </td>
          <td class="text-right whitespace-nowrap">
            {{ formatMoney(receiptItem.amount) }}
          </td>
          <td class="text-center">
            <a class="text-orange-500" style="font-size: 20px;" @click="modalReceiptItemUpdate?.openModal(index)">
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
          <th>Sản phẩm</th>
          <th
            v-if="settingStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.warehouse"
            style="width: 200px"
          >
            Nhập kho
          </th>
          <th>S.Lượng</th>
          <th v-if="settingStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.unit">Đ.Vị</th>
          <th>G.Nhập</th>
          <th>T.Tiền</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="receipt.receiptItemList!.length === 0">
          <td colspan="20" class="text-center">Chưa có dữ liệu</td>
        </tr>
        <tr v-for="(receiptItem, index) in receipt.receiptItemList" :key="index">
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
                :disabled="index === (receipt.receiptItemList?.length || 0) - 1"
                @click="changeItemPosition(index, 1)"
              >
                <IconSortDown style="opacity: 0.6" />
              </button>
            </div>
          </td>
          <td style="min-width: 150px">
            <div>
              <div class="font-bold">
                {{ receiptItem?.product?.brandName }}
                <a
                  v-if="settingStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.detail"
                  class="ml-1"
                  @click="modalProductDetail?.openModal(receiptItem?.product!)"
                >
                  <IconFileSearch />
                </a>
              </div>
              <div
                v-if="settingStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.substance"
                style="font-size: 0.8rem"
              >
                {{ receiptItem?.product?.substance }}
              </div>
              <div
                v-if="settingStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.lotNumberAndExpiryDate"
                style="font-size: 0.8rem"
              >
                <div v-if="receiptItem.lotNumber">S.Lô {{ receiptItem.lotNumber }}</div>
                <div v-if="receiptItem.expiryDate">
                  - HSD {{ timeToText(receiptItem.expiryDate) }}
                </div>
              </div>
            </div>
          </td>
          <td v-if="settingStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.warehouse">
            {{ warehouseMap[receiptItem.warehouseId]?.name }}
          </td>
          <td class="text-center font-bold">{{ receipt.receiptItemList![index].unitQuantity }}</td>
          <td v-if="settingStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.unit" class="text-center">
            {{ receiptItem.unitName }}
          </td>
          <td class="text-right">
            {{ formatMoney(receiptItem.unitCostPrice) }}
          </td>
          <td class="text-right">
            {{ formatMoney(receiptItem.amount) }}
          </td>
          <td class="text-center">
            <a
              class="text-orange-500"
              style="font-size: 22px"
              @click="modalReceiptItemUpdate?.openModal(index)"
            >
              <IconEditSquare />
            </a>
          </td>
        </tr>
        <tr>
          <td colspan="100" class="text-right">
            <span class="mr-10">Tổng tiền hàng:</span>
            <span class="mr-20">{{ formatMoney(receipt.itemsActualMoney) }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped></style>
