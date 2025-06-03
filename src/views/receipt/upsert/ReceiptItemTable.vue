<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { IconFileSearch } from '../../../common/icon-antd'
import { IconMinus, IconPlus, IconSortDown, IconSortUp } from '../../../common/icon-font-awesome'
import { IconEditSquare } from '../../../common/icon-google'
import { InputNumber } from '../../../common/vue-form'
import { useSettingStore } from '../../../modules/_me/setting.store'
import type { Warehouse } from '../../../modules/warehouse'
import { WarehouseService } from '../../../modules/warehouse/warehouse.service'
import { ESTimer } from '../../../utils'
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

const handleChangeReceiptItemUnitQuantity = (unitQuantity: number, index: number) => {
  receipt.value.receiptItemList![index].unitQuantity = unitQuantity
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
              v-if="settingStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.batchCodeAndExpiryDate"
              style="font-size: 0.8rem"
            >
              <div v-if="receiptItem.batchCode">S.Lô {{ receiptItem.batchCode }}</div>
              <div v-if="receiptItem.expiryDate">
                - HSD {{ ESTimer.timeToText(receiptItem.expiryDate) }}
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
            <div>
              <button
                style="border: none; font-size: 1.2rem; line-height: 0.5; background: none"
                class="disabled:opacity-[30%] disabled:cursor-not-allowed"
                @click="
                  (e) => handleChangeReceiptItemUnitQuantity(receiptItem.unitQuantity + 1, index)
                "
              >
                <IconSortUp style="opacity: 0.6" />
              </button>
              <div
                style="font-size: 1.1rem"
                contenteditable="true"
                @input="
                  (e) =>
                    handleChangeReceiptItemUnitQuantity(
                      Number((e.target as HTMLElement)?.innerText) || 0,
                      index,
                    )
                "
              >
                {{ receiptItem.unitQuantity }}
              </div>
              <button
                style="border: none; font-size: 1.2rem; line-height: 0.5; background: none"
                class="disabled:opacity-[30%] disabled:cursor-not-allowed"
                :disabled="receiptItem.unitQuantity == 0"
                @click="
                  (e) => handleChangeReceiptItemUnitQuantity(receiptItem.unitQuantity - 1, index)
                "
              >
                <IconSortDown style="opacity: 0.6" />
              </button>
            </div>
          </td>
          <td class="text-right whitespace-nowrap">
            {{ formatMoney(receiptItem.unitCostPrice) }}
          </td>
          <td class="text-right whitespace-nowrap">
            {{ formatMoney(receiptItem.amount) }}
          </td>
          <td class="text-center">
            <a
              class="text-orange-500"
              style="font-size: 20px"
              @click="modalReceiptItemUpdate?.openModal(index)"
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
          <th v-if="settingStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.warehouse">Nhập kho</th>
          <th style="min-width: 150px">S.Lượng</th>
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
          <td style="text-align: center; width: 80px">{{ receiptItem.product?.productCode }}</td>
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
                v-if="settingStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.batchCodeAndExpiryDate"
                style="font-size: 0.8rem"
              >
                <div v-if="receiptItem.batchCode">S.Lô {{ receiptItem.batchCode }}</div>
                <div v-if="receiptItem.expiryDate">
                  - HSD {{ ESTimer.timeToText(receiptItem.expiryDate) }}
                </div>
              </div>
            </div>
          </td>
          <td v-if="settingStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.warehouse">
            {{ warehouseMap[receiptItem.warehouseId]?.name }}
          </td>
          <td>
            <div class="flex items-center justify-between">
              <button
                style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                :disabled="receiptItem.quantity === 0"
                @click="
                  (e) => handleChangeReceiptItemUnitQuantity(receiptItem.unitQuantity - 1, index)
                "
              >
                <IconMinus />
              </button>
              <div style="width: calc(100% - 60px); min-width: 50px">
                <InputNumber
                  :value="receiptItem.unitQuantity"
                  textAlign="right"
                  @update:value="(v) => handleChangeReceiptItemUnitQuantity(v, index)"
                />
              </div>
              <button
                style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                @click="
                  (e) => handleChangeReceiptItemUnitQuantity(receiptItem.unitQuantity + 1, index)
                "
              >
                <IconPlus />
              </button>
            </div>
          </td>
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
