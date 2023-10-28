<script setup lang="ts">
import type { Product } from '@/modules/product'
import { useOrganizationStore } from '@/store/organization.store'
import { timeToText } from '@/utils'
import { DeleteOutlined, FileSearchOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import ModalProductDetail from '../../product/detail/ModalProductDetail.vue'
import { receipt } from './receipt-upsert.store'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const organizationStore = useOrganizationStore()
const { formatMoney } = organizationStore

const isMobile = window.innerWidth < 768

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
          <th>ĐG</th>
          <th>TT</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="receipt.receiptItems.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="(receiptItem, index) in (receipt.receiptItems || [])" :key="index">
          <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem;">{{ index + 1 }}</td>
          <td>
            <div class="font-medium">
              {{ receiptItem.productBatch?.product?.brandName }}
              <a v-if="organizationStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.detail" class="ml-1"
                @click="openModalProductDetail(receiptItem.productBatch?.product)">
                <FileSearchOutlined />
              </a>
            </div>
            <div v-if="organizationStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.substance" style="font-size: 0.8rem;">
              {{ receiptItem.productBatch?.product?.substance }}
            </div>
            <div class="flex gap-2 flex-wrap" style="font-size: 0.8rem;">
              <div v-if="organizationStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.batch">
                Lô: {{ receiptItem.productBatch.batch }}
              </div>
              <div v-if="organizationStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.expiryDate">
                HSD: {{ timeToText(receiptItem.productBatch.expiryDate, 'DD/MM/YY') }}
              </div>
            </div>
          </td>
          <td class="text-center whitespace-nowrap">
            <div class="item-quantity">
              <div class="item-quantity-up" @click="receipt.receiptItems[index].quantity += receiptItem.unit.rate">
                <font-awesome-icon :icon="['fas', 'sort-up']" style="opacity: 0.3;" />
              </div>
              <div class="item-quantity-down" @click="receipt.receiptItems[index].quantity -= receiptItem.unit.rate">
                <font-awesome-icon :icon="['fas', 'sort-down']" style="opacity: 0.3;" />
              </div>
              {{ receiptItem.quantity / receiptItem.unit.rate }}
            </div>
          </td>
          <td class="text-right whitespace-nowrap">
            {{ formatMoney(receiptItem.productBatch?.costPrice * receiptItem.unit.rate) }}
          </td>
          <td class="text-right whitespace-nowrap">
            {{ formatMoney(receiptItem.productBatch.costPrice * receiptItem.quantity) }}
          </td>
          <td class="text-center">
            <a @click="receipt.receiptItems.splice(index, 1)" class="text-red-500">
              <DeleteOutlined />
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-else class="table-wrapper mt-2">
    <table class="table">
      <thead>
        <tr>
          <th>#</th>
          <th>Tên hàng</th>
          <th v-if="organizationStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.batch">Lô</th>
          <th v-if="organizationStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.expiryDate">HSD</th>
          <th>Số lượng</th>
          <th v-if="organizationStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.unit">Đơn vị</th>
          <th>Giá nhập</th>
          <th>Tổng tiền</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="receipt.receiptItems.length === 0">
          <td colspan="20" class="text-center">Chưa có dữ liệu</td>
        </tr>
        <tr v-for="(ri, index) in receipt.receiptItems" :key="index">
          <td class="index"></td>
          <td style="min-width: 150px;">
            <div>
              <div class="font-bold"> {{ ri.productBatch?.product?.brandName }} <a
                  v-if="organizationStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.detail" class="ml-1"
                  @click="openModalProductDetail(ri.productBatch?.product)">
                  <FileSearchOutlined />
                </a></div>
              <div v-if="organizationStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.substance" style="font-size: 0.8rem;">
                {{ ri.productBatch?.product?.substance }}
              </div>
            </div>
          </td>
          <td v-if="organizationStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.batch">
            {{ ri.productBatch?.batch }}
          </td>
          <td v-if="organizationStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.expiryDate" class="text-center">
            {{ timeToText(ri.productBatch?.expiryDate) }}
          </td>
          <td class="text-center" style="min-width: 100px;">
            <a-input-number :value="receipt.receiptItems[index].quantity / receipt.receiptItems[index].unit.rate"
              @update:value="(e: any) => receipt.receiptItems[index].quantity = e * receipt.receiptItems[index].unit.rate"
              class="w-full" :min="0" />
          </td>
          <td v-if="organizationStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.unit" class="text-center">
            {{ ri.unit.name }}
          </td>
          <td class="text-right"> {{ formatMoney(ri.productBatch?.costPrice * ri.unit.rate) }} </td>
          <td class="text-right">{{ formatMoney(ri.productBatch?.costPrice * ri.quantity) }}</td>
          <td class="text-center">
            <a @click="receipt.receiptItems.splice(index, 1)" class="text-red-500 text-xl">
              <DeleteOutlined />
            </a>
          </td>
        </tr>
        <tr>
          <td colspan="100" class="text-right">
            <span class="mr-10">Tổng tiền hàng:</span>
            <span class="mr-20"> {{ formatMoney(receipt.totalItemMoney) }} </span>
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