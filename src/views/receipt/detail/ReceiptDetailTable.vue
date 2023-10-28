<script setup lang="ts">
import { ExclamationCircleOutlined, FileSearchOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import type { Product } from '../../../modules/product'
import { Receipt } from '../../../modules/receipt'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { timeToText } from '../../../utils'
import ModalProductDetail from '../../../views/product/detail/ModalProductDetail.vue'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()

const screenStore = useScreenStore()
const { formatMoney, isMobile } = screenStore

const props = withDefaults(defineProps<{ receipt: Receipt }>(), { receipt: () => Receipt.blank() })
const emit = defineEmits<{ (e: 'show-receipt-payment'): void }>()

const handleClickReceiptPaymentInfo = () => {
  emit('show-receipt-payment')
}
const openModalProductDetail = (data?: Product) => {
  if (data) modalProductDetail.value?.openModal(data)
}
</script>

<template>
  <ModalProductDetail ref="modalProductDetail" />
  <div v-if="isMobile" class="mt-2">
    <table class="table-mobile">
      <thead>
        <tr>
          <th>#</th>
          <th>Sản phẩm</th>
          <th>SL</th>
          <th>ĐG</th>
          <th>TT</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(receiptItem, index) in receipt.receiptItems || []" :key="index">
          <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
            {{ index + 1 }}
          </td>
          <td>
            <div class="font-medium">
              {{ receiptItem!.product!.brandName }}
              <a
                v-if="screenStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.detail"
                class="ml-1"
                @click="openModalProductDetail(receiptItem!.product)"
              >
                <FileSearchOutlined />
              </a>
            </div>
            <div
              v-if="screenStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.substance"
              style="font-size: 0.8rem"
            >
              {{ receiptItem!.product!.substance }}
            </div>
            <div
              v-if="
                screenStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.batch && receiptItem.batchId
              "
              style="font-size: 0.8rem"
            >
              Số Lô {{ receiptItem.batch!.lotNumber }} - HSD
              {{ timeToText(receiptItem.batch!.expiryDate, 'DD/MM/YY') }}
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
        </tr>
      </tbody>
    </table>
  </div>

  <div v-if="!isMobile" class="mt-2 px-4 table-wrapper w-full">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Tên</th>
          <th>Số lượng</th>
          <th v-if="screenStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.unit">Đơn vị</th>
          <th>Giá nhập</th>
          <th>Tổng tiền</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(receiptItem, index) in receipt.receiptItems || []" :key="index">
          <td class="index" />
          <td>
            <div class="text-justify">
              <div style="font-weight: 500">
                {{ receiptItem!.product!.brandName }}
                <a
                  v-if="screenStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.detail"
                  class="ml-1"
                  @click="openModalProductDetail(receiptItem!.product)"
                >
                  <FileSearchOutlined />
                </a>
              </div>
              <div v-if="screenStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.substance">
                {{ receiptItem!.product!.substance }}
              </div>
              <div
                v-if="
                  screenStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.batch && receiptItem.batchId
                "
              >
                S.Lô {{ receiptItem!.batch?.lotNumber }} - HSD
                {{ timeToText(receiptItem.batch?.expiryDate) }}
              </div>
            </div>
          </td>
          <td class="text-right">
            {{ receiptItem.unitQuantity }}
          </td>
          <td v-if="screenStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.unit" class="text-center">
            {{ receiptItem.unit?.name }}
          </td>
          <td class="text-right">
            {{ formatMoney(receiptItem.unitCostPrice) }}
          </td>
          <td class="text-right">
            {{ formatMoney(receiptItem.amount) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="md:px-4">
    <table class="table-mobile">
      <tbody>
        <tr v-if="screenStore.SCREEN_RECEIPT_DETAIL.paymentInfo.itemsActualMoney">
          <td class="text-right font-bold" style="width: 70%">Tiền hàng</td>
          <td class="text-right font-bold whitespace-nowrap">
            {{ formatMoney(receipt.itemsActualMoney) }}
          </td>
        </tr>
        <tr v-if="screenStore.SCREEN_RECEIPT_DETAIL.paymentInfo.discount || receipt.discountMoney">
          <td class="text-right">Chiết khấu</td>
          <td class="text-right whitespace-nowrap">
            <a-tag v-if="receipt.discountType === '%'" color="success">
              {{ receipt.discountPercent || 0 }}%
            </a-tag>
            {{ formatMoney(receipt.discountMoney) }}
          </td>
        </tr>
        <tr v-if="screenStore.SCREEN_RECEIPT_DETAIL.paymentInfo.surcharge || receipt.surcharge">
          <td class="text-right">Phụ phí</td>
          <td class="text-right whitespace-nowrap">
            {{ formatMoney(receipt.surcharge) }}
          </td>
        </tr>
        <tr>
          <td class="text-right font-bold">Tổng tiền</td>
          <td class="text-right font-bold whitespace-nowrap">
            {{ formatMoney(receipt.revenue) }}
          </td>
        </tr>
        <tr
          v-if="
            screenStore.SCREEN_RECEIPT_DETAIL.paymentInfo.paid || receipt.paid !== receipt.revenue
          "
        >
          <td class="text-right cursor-pointer" @click="handleClickReceiptPaymentInfo">
            <span class="mr-1"> Thanh toán </span>
            <ExclamationCircleOutlined />
          </td>
          <td class="text-right">
            {{ formatMoney(receipt.paid) }}
          </td>
        </tr>
        <tr v-if="screenStore.SCREEN_RECEIPT_DETAIL.paymentInfo.debt || receipt.debt">
          <td class="text-right">Ghi nợ</td>
          <td class="text-right whitespace-nowrap">
            {{ formatMoney(receipt.debt) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped></style>
