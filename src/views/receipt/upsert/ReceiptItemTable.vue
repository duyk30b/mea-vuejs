<script setup lang="ts">
import { DeleteOutlined, FileSearchOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import { InputNumber } from '../../../common/vue-form'
import type { Product } from '../../../modules/product'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { timeToText } from '../../../utils'
import ModalProductDetail from '../../product/detail/ModalProductDetail.vue'
import { receipt } from './receipt-upsert.store'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const screenStore = useScreenStore()
const { formatMoney, isMobile } = screenStore

const openModalProductDetail = (product?: Product) => {
  if (product) modalProductDetail.value?.openModal(product)
}
</script>

<template>
  <ModalProductDetail ref="modalProductDetail" />
  <div>Danh sách hàng trong phiếu</div>
  <div v-if="isMobile" class="mt-2">
    <table class="table-mobile">
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
        <tr v-if="receipt.receiptItems!.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="(receiptItem, index) in receipt.receiptItems || []" :key="index">
          <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
            {{ index + 1 }}
          </td>
          <td>
            <div class="font-medium">
              {{ receiptItem?.product?.brandName }}
              <a
                v-if="screenStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.detail"
                class="ml-1"
                @click="openModalProductDetail(receiptItem?.product)"
              >
                <FileSearchOutlined />
              </a>
            </div>
            <div
              v-if="screenStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.substance"
              style="font-size: 0.8rem"
            >
              {{ receiptItem?.product?.substance }}
            </div>
            <div
              v-if="
                screenStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.batch && receiptItem.batchId
              "
              style="font-size: 0.8rem"
            >
              S.Lô {{ receiptItem?.batch?.lotNumber }} - HSD
              {{ timeToText(receiptItem.batch?.expiryDate) }}
            </div>
          </td>
          <td class="text-center whitespace-nowrap">
            <div class="item-quantity">
              <div class="item-quantity-up" @click="receiptItem.unitQuantity++">
                <font-awesome-icon :icon="['fas', 'sort-up']" style="opacity: 0.3" />
              </div>
              <div class="item-quantity-down" @click="receiptItem.unitQuantity--">
                <font-awesome-icon :icon="['fas', 'sort-down']" style="opacity: 0.3" />
              </div>
              {{ receiptItem.unitQuantity }}
            </div>
          </td>
          <td class="text-right whitespace-nowrap">
            {{ formatMoney(receiptItem.unitCostPrice) }}
          </td>
          <td class="text-right whitespace-nowrap">
            {{ formatMoney(receiptItem.amount) }}
          </td>
          <td class="text-center">
            <a class="text-red-500" @click="receipt.receiptItems!.splice(index, 1)">
              <DeleteOutlined />
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-if="!isMobile" class="table-wrapper mt-2">
    <table class="table">
      <thead>
        <tr>
          <th>#</th>
          <th>Sản phẩm</th>
          <th>S.Lượng</th>
          <th v-if="screenStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.unit">Đ.Vị</th>
          <th>G.Nhập</th>
          <th>T.Tiền</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="receipt.receiptItems!.length === 0">
          <td colspan="20" class="text-center">Chưa có dữ liệu</td>
        </tr>
        <tr v-for="(receiptItem, index) in receipt.receiptItems" :key="index">
          <td class="text-center">
            {{ index + 1 }}
          </td>
          <td style="min-width: 150px">
            <div>
              <div class="font-bold">
                {{ receiptItem?.product?.brandName }}
                <a
                  v-if="screenStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.detail"
                  class="ml-1"
                  @click="openModalProductDetail(receiptItem?.product)"
                >
                  <FileSearchOutlined />
                </a>
              </div>
              <div
                v-if="screenStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.substance"
                style="font-size: 0.8rem"
              >
                {{ receiptItem?.product?.substance }}
              </div>
              <div
                v-if="
                  screenStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.batch && receiptItem.batchId
                "
                style="font-size: 0.8rem"
              >
                S.Lô {{ receiptItem?.batch?.lotNumber }} - HSD
                {{ timeToText(receiptItem.batch?.expiryDate) }}
              </div>
            </div>
          </td>
          <td class="text-center" style="width: 150px">
            <div class="flex items-center justify-between">
              <div
                style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                class="flex items-center justify-center cursor-pointer hover:bg-[#dedede]"
                @click="receipt.receiptItems![index].unitQuantity--"
              >
                <font-awesome-icon :icon="['fas', 'minus']" />
              </div>
              <div style="width: calc(100% - 60px); min-width: 50px">
                <InputNumber
                  v-model:value="receipt.receiptItems![index].unitQuantity"
                  :textAlign="'right'"
                />
              </div>
              <div
                style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                class="flex items-center justify-center cursor-pointer hover:bg-[#dedede]"
                @click="receipt.receiptItems![index].unitQuantity++"
              >
                <font-awesome-icon :icon="['fas', 'plus']" />
              </div>
            </div>
          </td>
          <td v-if="screenStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.unit" class="text-center">
            {{ receiptItem.unit.name }}
          </td>
          <td class="text-right">
            {{ formatMoney(receiptItem.unitCostPrice) }}
          </td>
          <td class="text-right">
            {{ formatMoney(receiptItem.amount) }}
          </td>
          <td class="text-center">
            <a class="text-red-500 text-xl" @click="receipt.receiptItems!.splice(index, 1)">
              <DeleteOutlined />
            </a>
          </td>
        </tr>
        <tr>
          <td colspan="100" class="text-right">
            <span class="mr-10">Tổng tiền hàng:</span>
            <span class="mr-20"> {{ formatMoney(receipt.itemsActualMoney) }} </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped>
.item-quantity {
  position: relative;
  line-height: 2rem;

  .item-quantity-text {
    width: 2rem;
    padding: 0.5rem 0;
    display: flex;
    justify-content: center;
    font-size: 1.1rem;
    line-height: 2rem;
  }

  .item-quantity-up {
    position: absolute;
    font-size: 1.2rem;
    line-height: 0.1rem;
    top: -15%;
    left: 50%;
    transform: translate(-50%, 0%);
  }

  .item-quantity-down {
    position: absolute;
    font-size: 1.2rem;
    line-height: 0.1rem;
    top: 115%;
    left: 50%;
    transform: translate(-50%, -100%);
  }
}
</style>
